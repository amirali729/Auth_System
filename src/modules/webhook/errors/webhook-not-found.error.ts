import type { ErrorShape } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/errors/error.shape.js';

export class WebhookNotFoundError implements ErrorShape {
  readonly kind = 'webhook_not_found';
  readonly timestamp = new Date();

  constructor(public readonly message = 'Webhook not found.') {}
}
