import { Logger } from '../../../shared/utils/logger.js';
import type { IWebhookDeliveryRepository } from '../repository/interface/webhook-delivery.repository.interface.js';

export interface IWebhookDeliveryQueue {
  /** Schedules an immediate delivery attempt for this delivery row. Never throws, never blocks the caller - same contract as IEventBus.publish(). */
  enqueue(deliveryId: string): void;
}

/**
 * In-process queue: `enqueue()` defers to setImmediate (no persistence -
 * a process crash between enqueue and execution loses that attempt,
 * same documented limitation as InMemoryEventBus), and a periodic sweep
 * separately re-enqueues anything due for a scheduled RETRY (found via
 * WebhookDeliveryRepository.findDueForRetry() - see the model's
 * nextAttemptAt field). This two-part design (immediate dispatch +
 * periodic retry sweep) is what "Queue-based asynchronous delivery"
 * means in this implementation - explicitly not durable, explicitly the
 * one piece a real message broker would replace wholesale later.
 */
export class InMemoryWebhookDeliveryQueue implements IWebhookDeliveryQueue {
  private sweepIntervalHandle?: ReturnType<typeof setInterval>;

  constructor(
    private readonly processDelivery: (deliveryId: string) => Promise<void>,
    private readonly deliveryRepository: IWebhookDeliveryRepository,
  ) {}

  enqueue(deliveryId: string): void {
    setImmediate(() => {
      this.processDelivery(deliveryId).catch((error) => {
        // A processing bug must never crash the process or block any
        // other delivery - same isolation guarantee as the Event Bus's
        // per-subscriber error handling.
        Logger.error(
          `[WebhookDeliveryQueue] unexpected error processing delivery ${deliveryId}`,
          error,
        );
      });
    });
  }

  /** Starts the periodic sweep for scheduled retries. Call once at boot (see bootstrap-webhook-delivery.ts). */
  startRetrySweep(intervalMs = 30_000): void {
    this.sweepIntervalHandle = setInterval(() => {
      void this.sweepOnce();
    }, intervalMs);

    // Never keep the process (or a test runner) alive just for this timer.
    this.sweepIntervalHandle.unref();
  }

  stopRetrySweep(): void {
    if (this.sweepIntervalHandle) clearInterval(this.sweepIntervalHandle);
  }

  private async sweepOnce(): Promise<void> {
    const due = await this.deliveryRepository.findDueForRetry();

    if (!due.ok) {
      Logger.error('[WebhookDeliveryQueue] retry sweep failed to query due deliveries', due.error);
      return;
    }

    for (const delivery of due.value) {
      this.enqueue(delivery._id.toString());
    }
  }
}
