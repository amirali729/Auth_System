import { auditService } from '../../audit/routes/audit.routes.js';
import { eventBus } from '../../../shared/events/event-bus.js';
import { WebhookDeliveryRepository } from '../repository/webhook-delivery.repository.impl.js';
import { WebhookRepository } from '../repository/webhook.repository.impl.js';
import { InMemoryWebhookDeliveryQueue } from './webhook-delivery-queue.js';
import { WebhookDeliveryWorker } from './webhook-delivery-worker.js';
import { WebhookDispatcher } from './webhook-dispatcher.js';

// Module-level singletons, constructed once when this module is first
// imported. Both app.ts (to boot the pipeline) and webhook.routes.ts (to
// enqueue a manual redelivery against the SAME queue the retry sweep and
// the dispatcher use) import from this one file, so there is exactly one
// queue/worker/repository instance backing the whole delivery pipeline -
// never a second, disconnected instance constructed by the routes file.
const webhookRepository = new WebhookRepository();
const webhookDeliveryRepository = new WebhookDeliveryRepository();

const webhookDeliveryWorker = new WebhookDeliveryWorker(
  webhookRepository,
  webhookDeliveryRepository,
  auditService,
);

export const webhookDeliveryQueue = new InMemoryWebhookDeliveryQueue(
  (deliveryId) => webhookDeliveryWorker.attemptDelivery(deliveryId),
  webhookDeliveryRepository,
);

const webhookDispatcher = new WebhookDispatcher(
  webhookRepository,
  webhookDeliveryRepository,
  webhookDeliveryQueue,
);

let bootstrapped = false;

/**
 * Starts the retry sweep and subscribes the dispatcher to the real
 * `eventBus` singleton. Called exactly once, at process boot (see
 * app.ts). Idempotent - guards against being accidentally called twice
 * (e.g. from a test importing app.ts more than once), which would
 * otherwise double-subscribe the dispatcher and double-deliver every
 * event.
 */
export function bootstrapWebhookDelivery(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  webhookDeliveryQueue.startRetrySweep();
  webhookDispatcher.subscribeTo(eventBus);
}
