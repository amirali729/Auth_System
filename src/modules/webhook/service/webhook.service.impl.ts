import crypto from 'crypto';

import { InfrastructureError } from '../../../shared/errors/infrastructure.error.js';
import { ValidationError } from '../../../shared/errors/validation.error.js';
import { err, ok } from '../../../shared/result/result.js';
import { encryptSecret } from '../../../shared/security/encryption/symmetric-encryption.js';
import { RecordAuditEventDto } from '../../audit/dto/record-audit-event.dto.js';
import type { IAuditLogger } from '../../audit/service/interface/audit-logger.interface.js';
import { OrganizationNotFoundError } from '../../organizations/errors/organization-not-found.error.js';
import type { CreateWebhookDto } from '../dto/create-webhook.dto.js';
import type { UpdateWebhookDto } from '../dto/update-webhook.dto.js';
import { WebhookDeliveryNotFoundError } from '../errors/webhook-delivery-not-found.error.js';
import { WebhookNotFoundError } from '../errors/webhook-not-found.error.js';
import { toWebhookDeliveryResponse, toWebhookResponse } from '../mapper/webhook.mapper.js';
import type { IWebhookDeliveryRepository } from '../repository/interface/webhook-delivery.repository.interface.js';
import type { IWebhookRepository } from '../repository/interface/webhook.repository.interface.js';
import { RedeliverWebhookResponse } from '../responses/redeliver-webhook.response.js';
import { RotateWebhookSecretResponse } from '../responses/rotate-webhook-secret.response.js';
import { WebhookCreatedResponse } from '../responses/webhook-created.response.js';
import { validateWebhookUrl } from '../security/url-safety.js';
import type {
  DeleteWebhookResult,
  RedeliverWebhookResult,
  RotateWebhookSecretResult,
  WebhookCreatedResult,
  WebhookDeliveryListResult,
  WebhookListResult,
  WebhookResult,
} from '../types/webhook.types.js';
import type { IWebhookDeliveryQueue } from '../worker/webhook-delivery-queue.js';
import type { IWebhookService } from './interface/webhook.service.interface.js';

/** whsec_ prefix mirrors Stripe's convention - immediately recognizable as a webhook secret, distinct from an API key or client secret. */
function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
}

export class WebhookService implements IWebhookService {
  constructor(
    private readonly repository: IWebhookRepository,
    private readonly auditLogger?: IAuditLogger,
    // Optional so existing call sites/tests that only exercise CRUD (and
    // never touch delivery history/redelivery) don't have to construct
    // the whole delivery pipeline just to instantiate this service.
    // listDeliveries()/redeliver() fail with InfrastructureError if
    // these were never provided, rather than throwing at construction.
    private readonly deliveryRepository?: IWebhookDeliveryRepository,
    private readonly deliveryQueue?: IWebhookDeliveryQueue,
  ) {}

  async list(
    organizationId: string,
    callerTenantId: string | undefined,
    callerId: string,
  ): Promise<WebhookListResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const found = await this.repository.findByOrganization(organizationId);

    if (!found.ok) {
      return err(found.error);
    }

    return ok(found.value.map(toWebhookResponse));
  }

  async create(
    organizationId: string,
    dto: CreateWebhookDto,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<WebhookCreatedResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const urlCheck = validateWebhookUrl(dto.url);
    if (!urlCheck.ok) {
      return err(new ValidationError(urlCheck.reason));
    }

    if (dto.subscribedEvents.length === 0) {
      return err(new ValidationError('At least one subscribed event (or "*") is required.'));
    }

    const secret = generateWebhookSecret();

    const created = await this.repository.create({
      organizationId,
      name: dto.name,
      url: dto.url,
      secretEncrypted: encryptSecret(secret),
      subscribedEvents: dto.subscribedEvents,
    });

    if (!created.ok) {
      return err(created.error);
    }

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'webhook.created',
        true,
        actorId,
        'user',
        'webhook',
        created.value._id.toString(),
        undefined,
        undefined,
        { url: dto.url, subscribedEvents: dto.subscribedEvents },
        organizationId,
      ),
    );

    return ok(new WebhookCreatedResponse(toWebhookResponse(created.value), secret));
  }

  async update(
    organizationId: string,
    webhookId: string,
    dto: UpdateWebhookDto,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<WebhookResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const existing = await this.findScopedWebhook(organizationId, webhookId);
    if (!existing.ok) return err(existing.error);
    if (!existing.value) return err(new WebhookNotFoundError());

    if (dto.url !== undefined) {
      const urlCheck = validateWebhookUrl(dto.url);
      if (!urlCheck.ok) {
        return err(new ValidationError(urlCheck.reason));
      }
    }

    if (dto.subscribedEvents !== undefined && dto.subscribedEvents.length === 0) {
      return err(new ValidationError('At least one subscribed event (or "*") is required.'));
    }

    const updated = await this.repository.update(webhookId, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.url !== undefined ? { url: dto.url } : {}),
      ...(dto.subscribedEvents !== undefined ? { subscribedEvents: dto.subscribedEvents } : {}),
    });

    if (!updated.ok) {
      return err(updated.error);
    }

    if (!updated.value) {
      return err(new WebhookNotFoundError());
    }

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'webhook.updated',
        true,
        actorId,
        'user',
        'webhook',
        webhookId,
        undefined,
        undefined,
        undefined,
        organizationId,
      ),
    );

    return ok(toWebhookResponse(updated.value));
  }

  async rotateSecret(
    organizationId: string,
    webhookId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<RotateWebhookSecretResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const existing = await this.findScopedWebhook(organizationId, webhookId);
    if (!existing.ok) return err(existing.error);
    if (!existing.value) return err(new WebhookNotFoundError());

    const secret = generateWebhookSecret();

    const updated = await this.repository.updateSecret(webhookId, encryptSecret(secret));

    if (!updated.ok) {
      return err(updated.error);
    }

    if (!updated.value) {
      return err(new WebhookNotFoundError());
    }

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'webhook.secret_rotated',
        true,
        actorId,
        'user',
        'webhook',
        webhookId,
        undefined,
        undefined,
        undefined,
        organizationId,
      ),
    );

    return ok(new RotateWebhookSecretResponse(webhookId, secret));
  }

  async enable(
    organizationId: string,
    webhookId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<WebhookResult> {
    return this.setStatus(organizationId, webhookId, callerTenantId, callerId, 'active', actorId);
  }

  async disable(
    organizationId: string,
    webhookId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<WebhookResult> {
    return this.setStatus(organizationId, webhookId, callerTenantId, callerId, 'disabled', actorId);
  }

  private async setStatus(
    organizationId: string,
    webhookId: string,
    callerTenantId: string | undefined,
    callerId: string,
    status: 'active' | 'disabled',
    actorId?: string,
  ): Promise<WebhookResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const existing = await this.findScopedWebhook(organizationId, webhookId);
    if (!existing.ok) return err(existing.error);
    if (!existing.value) return err(new WebhookNotFoundError());

    const updated = await this.repository.setStatus(webhookId, status);

    if (!updated.ok) {
      return err(updated.error);
    }

    if (!updated.value) {
      return err(new WebhookNotFoundError());
    }

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        status === 'active' ? 'webhook.enabled' : 'webhook.disabled',
        true,
        actorId,
        'user',
        'webhook',
        webhookId,
        undefined,
        undefined,
        undefined,
        organizationId,
      ),
    );

    return ok(toWebhookResponse(updated.value));
  }

  async delete(
    organizationId: string,
    webhookId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<DeleteWebhookResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const existing = await this.findScopedWebhook(organizationId, webhookId);
    if (!existing.ok) return err(existing.error);
    if (!existing.value) return err(new WebhookNotFoundError());

    const deleted = await this.repository.delete(webhookId);

    if (!deleted.ok) {
      return err(deleted.error);
    }

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'webhook.deleted',
        true,
        actorId,
        'user',
        'webhook',
        webhookId,
        undefined,
        undefined,
        undefined,
        organizationId,
      ),
    );

    return ok({ message: 'Webhook deleted successfully.' });
  }

  async listDeliveries(
    organizationId: string,
    webhookId: string,
    callerTenantId: string | undefined,
    callerId: string,
  ): Promise<WebhookDeliveryListResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    // Ownership check happens on the WEBHOOK first (same IDOR guard as
    // every other webhook-scoped operation) - a caller can only ever
    // list deliveries for a webhook that is actually theirs, regardless
    // of what deliveryRepository.findByWebhook() itself would return.
    const existing = await this.findScopedWebhook(organizationId, webhookId);
    if (!existing.ok) return err(existing.error);
    if (!existing.value) return err(new WebhookNotFoundError());

    if (!this.deliveryRepository) {
      return err(new InfrastructureError());
    }

    const found = await this.deliveryRepository.findByWebhook(webhookId);
    if (!found.ok) {
      return err(found.error);
    }

    return ok(found.value.map(toWebhookDeliveryResponse));
  }

  async redeliver(
    organizationId: string,
    webhookId: string,
    deliveryId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<RedeliverWebhookResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const existingWebhook = await this.findScopedWebhook(organizationId, webhookId);
    if (!existingWebhook.ok) return err(existingWebhook.error);
    if (!existingWebhook.value) return err(new WebhookNotFoundError());

    if (!this.deliveryRepository || !this.deliveryQueue) {
      return err(new InfrastructureError());
    }

    const found = await this.deliveryRepository.findById(deliveryId);
    if (!found.ok) return err(found.error);

    // Second IDOR guard, same pattern as findScopedWebhook: a delivery
    // id that's valid but belongs to a DIFFERENT webhook (even one in
    // the same organization) must never be redeliverable through this
    // webhook's route - deliveries are scoped to the exact webhook they
    // were addressed to, not just to the organization.
    if (!found.value || found.value.webhookId.toString() !== webhookId) {
      return err(new WebhookDeliveryNotFoundError());
    }

    const reset = await this.deliveryRepository.resetForRedelivery(deliveryId);
    if (!reset.ok) return err(reset.error);
    if (!reset.value) return err(new WebhookDeliveryNotFoundError());

    this.deliveryQueue.enqueue(deliveryId);

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'webhook.delivery_redelivered',
        true,
        actorId,
        'user',
        'webhook',
        webhookId,
        undefined,
        undefined,
        { deliveryId },
        organizationId,
      ),
    );

    return ok(new RedeliverWebhookResponse(deliveryId, 'pending'));
  }

  /**
   * Fetch-then-compare ownership check (IDOR guard) - without it, any
   * caller holding generic "webhook:*" permission scoped to their OWN
   * organization could still reach or modify ANOTHER organization's
   * webhook simply by passing its id, since permission keys alone say
   * nothing about which specific resource a request targets. Every
   * organization-scoped resource in this codebase (Application,
   * Membership, Role assignment) uses this same pattern.
   */
  private async findScopedWebhook(organizationId: string, webhookId: string) {
    const found = await this.repository.findById(webhookId);

    if (!found.ok) {
      return found;
    }

    if (!found.value || found.value.organizationId.toString() !== organizationId) {
      return ok(null);
    }

    return found;
  }

  private async belongsToCaller(
    organizationId: string,
    callerTenantId: string | undefined,
    callerId: string,
  ): Promise<boolean> {
    // No allowPlatformOperator here: the Roles & Permissions doc does
    // not grant Platform Owner/Admin/Support direct cross-organization
    // access to another org's webhooks - only to Organizations/Users
    // (and, via the dedicated Admin/Metrics modules, Applications/API
    // Keys/Audit Logs). A platform operator acting on webhooks still
    // needs their own Membership in that org, same as anyone else.
    return callerBelongsToOrganization(organizationId, callerTenantId, callerId);
  }
}
