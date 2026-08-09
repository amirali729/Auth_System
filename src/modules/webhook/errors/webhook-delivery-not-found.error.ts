import type { ErrorShape } from '../../../shared/errors/error.shape.js';

export class WebhookDeliveryNotFoundError implements ErrorShape {
  readonly kind = 'webhook_delivery_not_found';
  readonly timestamp = new Date();

  constructor(public readonly message = 'Webhook delivery not found.') {}
}
