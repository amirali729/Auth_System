import type { ErrorShape } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/errors/error.shape.js';

export class WebhookDeliveryNotFoundError implements ErrorShape {
  readonly kind = 'webhook_delivery_not_found';
  readonly timestamp = new Date();

  constructor(public readonly message = 'Webhook delivery not found.') {}
}
