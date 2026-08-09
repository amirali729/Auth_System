import type { DomainEvent } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/events/domain-event.js';
import type { IEventBus } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/events/event-bus.interface.js';
import { Logger } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/utils/logger.js';
import { toWebhookEventPayload } from '../mapper/webhook-event.mapper.js';
import type { IWebhookDeliveryRepository } from '../repository/interface/webhook-delivery.repository.interface.js';
import type { IWebhookRepository } from '../repository/interface/webhook.repository.interface.js';
import type { IWebhookDeliveryQueue } from './webhook-delivery-queue.js';

const DEFAULT_MAX_ATTEMPTS = 6;

/**
 * Subscribes to EVERY domain event ('*' - see IEventBus.subscribe) and,
 * for each one, enqueues a delivery to every ACTIVE webhook subscribed to
 * that event type WITHIN THE SAME ORGANIZATION. This is the concrete
 * enforcement point for "webhooks must never cross organization
 * boundaries": `findActiveSubscribers(event.organizationId, event.type)`
 * is a database query filtered by organizationId at the query level -
 * exactly the same "filter in the query, never fetch-then-filter"
 * principle the Authorization Architecture document describes for
 * Membership-scoped permission checks. A webhook belonging to a
 * different organization is never fetched, never considered, never a
 * possible target - not merely checked and rejected afterward.
 *
 * Business modules never call this directly and never know it exists -
 * they only ever call eventBus.publish() (see shared/events/domain-
 * events.ts and every *.service.impl.ts that publishes an event). This
 * class is wired up once, at boot (see bootstrap-webhook-delivery.ts).
 */
export class WebhookDispatcher {
  constructor(
    private readonly webhookRepository: IWebhookRepository,
    private readonly deliveryRepository: IWebhookDeliveryRepository,
    private readonly deliveryQueue: IWebhookDeliveryQueue,
  ) {}

  subscribeTo(eventBus: IEventBus): void {
    eventBus.subscribe('*', (event: DomainEvent) => this.handleEvent(event));
  }

  private async handleEvent(event: DomainEvent): Promise<void> {
    // Platform-level events (no organizationId - e.g. a bare user.login
    // not tied to any one org) have no possible webhook subscribers by
    // definition, since every Webhook belongs to exactly one
    // Organization. Nothing to look up.
    if (!event.organizationId) {
      return;
    }

    const subscribers = await this.webhookRepository.findActiveSubscribers(
      event.organizationId,
      event.type,
    );

    if (!subscribers.ok) {
      Logger.error(
        `[WebhookDispatcher] failed to look up subscribers for event "${event.type}" (org ${event.organizationId})`,
        subscribers.error,
      );
      return;
    }

    if (subscribers.value.length === 0) {
      return;
    }

    const payload = toWebhookEventPayload(event);

    // One failing webhook must never prevent delivery to any other -
    // each subscriber gets its own delivery row and its own independent
    // enqueue; a failure in one is invisible to the others (see
    // WebhookDeliveryWorker, which never throws, and getOrCreate's
    // per-row isolation).
    for (const webhook of subscribers.value) {
      const created = await this.deliveryRepository.getOrCreate({
        webhookId: webhook._id.toString(),
        organizationId: event.organizationId,
        eventId: event.id,
        eventType: event.type,
        // WebhookEventPayload is a fixed-shape interface (no index
        // signature), so it isn't structurally assignable to the
        // repository's `Record<string, unknown>` storage type without an
        // explicit cast - this is a storage-layer widening, not a loss of
        // type safety at the call site (the value assigned is still
        // exactly the mapper's output).
        payload: payload as unknown as Record<string, unknown>,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
      });

      if (!created.ok) {
        Logger.error(
          `[WebhookDispatcher] failed to create delivery row for webhook ${webhook._id.toString()}, event ${event.id}`,
          created.error,
        );
        continue;
      }

      this.deliveryQueue.enqueue(created.value._id.toString());
    }
  }
}
