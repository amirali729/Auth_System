import type { DomainEvent } from '../../../shared/events/domain-event.js';
import type { WebhookEventPayload } from '../types/webhook-event-payload.js';

/**
 * The ONLY function allowed to turn a DomainEvent into something that
 * leaves this process over HTTP. The Webhook Dispatcher (Phase 3c) must
 * call this before signing/sending anything - it must never
 * `JSON.stringify(domainEvent)` directly, which would leak internal
 * routing metadata (organizationId, actorId) into every customer's
 * webhook payload and couple their integration to whatever internal
 * shape DomainEvent happens to have today.
 *
 * Deliberately explicit about which fields carry over rather than a
 * blind spread - `data` is exactly the DomainEvent's `payload`, nothing
 * more, nothing automatically added.
 */
export function toWebhookEventPayload<TPayload extends Record<string, unknown>>(
  event: DomainEvent<TPayload>,
): WebhookEventPayload<TPayload> {
  return {
    id: event.id,
    event: event.type,
    created_at: event.occurredAt.toISOString(),
    data: event.payload,
  };
}
