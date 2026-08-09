import type { ErrorShape } from '../../../shared/errors/error.shape.js';

export class WebhookNotFoundError implements ErrorShape {
  readonly kind = 'webhook_not_found';
  readonly timestamp = new Date();

  constructor(public readonly message = 'Webhook not found.') {}
}
