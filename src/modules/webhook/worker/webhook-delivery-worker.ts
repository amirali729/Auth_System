import { decryptSecret } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/security/encryption/symmetric-encryption.js';
import { Logger } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/utils/logger.js';
import { RecordAuditEventDto } from '../../../../../Auth_System_updated (2)/Auth_System/src/modules/audit/dto/record-audit-event.dto.js';
import type { IAuditLogger } from '../../../../../Auth_System_updated (2)/Auth_System/src/modules/audit/service/interface/audit-logger.interface.js';
import type { IWebhookDeliveryRepository } from '../repository/interface/webhook-delivery.repository.interface.js';
import type { IWebhookRepository } from '../repository/interface/webhook.repository.interface.js';
import { computeWebhookSignature } from '../security/signature.js';
import { assertSafeForDelivery } from '../security/ssrf-guard.js';
import { computeNextRetryDelayMs } from './retry-schedule.js';

const REQUEST_TIMEOUT_MS = 10_000;

export class WebhookDeliveryWorker {
  constructor(
    private readonly webhookRepository: IWebhookRepository,
    private readonly deliveryRepository: IWebhookDeliveryRepository,
    private readonly auditLogger?: IAuditLogger,
  ) {}

  /**
   * One delivery attempt for one (webhook, event) row. Called by the
   * queue - see InMemoryWebhookDeliveryQueue - for both the first
   * attempt and every subsequent retry (and for manual redelivery, which
   * just re-enqueues the same delivery id). Never throws - every failure
   * path is handled internally (mark failed/dead-letter and return),
   * because one delivery erroring must never crash the worker or affect
   * any other delivery in flight.
   */
  async attemptDelivery(deliveryId: string): Promise<void> {
    const deliveryResult = await this.deliveryRepository.findById(deliveryId);

    if (!deliveryResult.ok || !deliveryResult.value) {
      Logger.error(`[WebhookDeliveryWorker] delivery ${deliveryId} not found - skipping`);
      return;
    }

    const delivery = deliveryResult.value;

    // Already terminal (delivered, or already dead-lettered) - nothing
    // to do. Can legitimately happen if the retry sweep and a manual
    // redelivery both enqueue the same row around the same time.
    if (delivery.status === 'delivered' || delivery.status === 'dead_letter') {
      return;
    }

    const webhookResult = await this.webhookRepository.findById(delivery.webhookId.toString());

    if (!webhookResult.ok || !webhookResult.value) {
      // The webhook was deleted after this delivery was enqueued -
      // abandon rather than retry against nothing.
      await this.deliveryRepository.markDeadLetter(deliveryId, 'Webhook no longer exists.');
      return;
    }

    const webhook = webhookResult.value;

    if (webhook.status !== 'active') {
      // Disabled, not deleted - don't dead-letter permanently (it may be
      // re-enabled later), but don't attempt delivery either. It simply
      // stays 'pending'/'failed' with its existing nextAttemptAt; the
      // retry sweep will pick it up again, by which point it may be
      // active again.
      Logger.info(
        `[WebhookDeliveryWorker] webhook ${webhook._id.toString()} is disabled - skipping delivery ${deliveryId}`,
      );
      return;
    }

    const ssrfCheck = await assertSafeForDelivery(webhook.url);

    if (!ssrfCheck.ok) {
      // A permanently-unsafe URL is a configuration problem, not a
      // transient failure - retrying it is pointless and every retry
      // would re-attempt a DNS lookup against a URL that will never
      // become safe on its own. Dead-letter immediately.
      await this.deliveryRepository.markDeadLetter(
        deliveryId,
        `Blocked by SSRF guard: ${ssrfCheck.reason}`,
      );
      await this.webhookRepository.recordDeliveryOutcome(webhook._id.toString(), 'failure');
      Logger.error(`[WebhookDeliveryWorker] delivery ${deliveryId} blocked: ${ssrfCheck.reason}`);
      return;
    }

    const marked = await this.deliveryRepository.markDelivering(deliveryId);

    if (!marked.ok || !marked.value) {
      Logger.error(`[WebhookDeliveryWorker] failed to mark delivery ${deliveryId} as delivering`);
      return;
    }

    // The authoritative attempt number - from the just-persisted
    // increment, not computed locally, so it can never drift from what's
    // actually stored.
    const attemptNumber = marked.value.attempts;
    const maxAttempts = marked.value.maxAttempts;

    const rawBody = JSON.stringify(delivery.payload);
    const timestampSeconds = Math.floor(Date.now() / 1000);

    let secret: string;
    try {
      secret = decryptSecret(webhook.secretEncrypted);
    } catch (error) {
      // Should be unreachable in practice (would mean the encryption key
      // changed without a migration, or the stored value was corrupted)
      // - dead-letter rather than retry, since retrying can't fix it.
      await this.deliveryRepository.markDeadLetter(deliveryId, 'Failed to decrypt webhook secret.');
      Logger.error(
        `[WebhookDeliveryWorker] could not decrypt secret for webhook ${webhook._id.toString()}`,
        error,
      );
      return;
    }

    const signature = computeWebhookSignature(secret, timestampSeconds, rawBody);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Aegis-Signature': signature,
          'X-Aegis-Timestamp': String(timestampSeconds),
          'X-Aegis-Event': delivery.eventType,
        },
        body: rawBody,
        // Never follow redirects - a compromised or malicious endpoint
        // could redirect a delivery to an internal address, defeating
        // the SSRF check above entirely if we blindly followed it.
        redirect: 'manual',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.status >= 200 && response.status < 300) {
        await this.deliveryRepository.markDelivered(deliveryId, response.status);
        await this.webhookRepository.recordDeliveryOutcome(webhook._id.toString(), 'success');
        Logger.info(
          `[WebhookDeliveryWorker] delivery ${deliveryId} succeeded (HTTP ${response.status})`,
        );
        return;
      }

      // Non-2xx, INCLUDING a 3xx redirect response (redirect: 'manual'
      // means fetch returns the redirect response itself rather than
      // following it) - both count as a failed delivery attempt.
      const responseBody = await response.text().catch(() => '');
      await this.handleFailure(
        deliveryId,
        webhook._id.toString(),
        attemptNumber,
        maxAttempts,
        `HTTP ${response.status}`,
        response.status,
        responseBody,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.name === 'TimeoutError' || error.name === 'AbortError'
            ? `Request timed out after ${REQUEST_TIMEOUT_MS}ms`
            : error.message
          : 'Unknown delivery error';

      await this.handleFailure(
        deliveryId,
        webhook._id.toString(),
        attemptNumber,
        maxAttempts,
        message,
      );
    }
  }

  private async handleFailure(
    deliveryId: string,
    webhookId: string,
    attemptNumber: number,
    maxAttempts: number,
    errorMessage: string,
    responseStatus?: number,
    responseBody?: string,
  ): Promise<void> {
    await this.webhookRepository.recordDeliveryOutcome(webhookId, 'failure');

    if (attemptNumber >= maxAttempts) {
      await this.deliveryRepository.markDeadLetter(deliveryId, errorMessage);

      void this.auditLogger?.record(
        new RecordAuditEventDto(
          'webhook.delivery_dead_lettered',
          false,
          undefined,
          'system',
          'webhook',
          webhookId,
          undefined,
          undefined,
          { deliveryId, attempts: attemptNumber, errorMessage },
        ),
      );

      Logger.error(
        `[WebhookDeliveryWorker] delivery ${deliveryId} dead-lettered after ${attemptNumber} attempts: ${errorMessage}`,
      );
      return;
    }

    const delayMs = computeNextRetryDelayMs(attemptNumber);

    await this.deliveryRepository.markFailed(deliveryId, {
      responseStatus,
      responseBody,
      errorMessage,
      nextAttemptAt: new Date(Date.now() + delayMs),
    });

    Logger.warn(
      `[WebhookDeliveryWorker] delivery ${deliveryId} failed (attempt ${attemptNumber}/${maxAttempts}), retrying in ${delayMs}ms: ${errorMessage}`,
    );
  }
}
