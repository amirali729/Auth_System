import type { InfrastructureError } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/errors/infrastructure.error.js';
import type { ValidationError } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/errors/validation.error.js';
import type { Result } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/result/result.js';
import type { OrganizationNotFoundError } from '../../../../../Auth_System_updated (2)/Auth_System/src/modules/organizations/errors/organization-not-found.error.js';
import type { WebhookDeliveryNotFoundError } from '../errors/webhook-delivery-not-found.error.js';
import type { WebhookNotFoundError } from '../errors/webhook-not-found.error.js';
import type { RedeliverWebhookResponse } from '../responses/redeliver-webhook.response.js';
import type { RotateWebhookSecretResponse } from '../responses/rotate-webhook-secret.response.js';
import type { WebhookCreatedResponse } from '../responses/webhook-created.response.js';
import type { WebhookDeliveryResponse } from '../responses/webhook-delivery.response.js';
import type { WebhookResponse } from '../responses/webhook.response.js';

export type WebhookError =
  | WebhookNotFoundError
  | WebhookDeliveryNotFoundError
  | OrganizationNotFoundError
  | ValidationError
  | InfrastructureError;

export type WebhookResult = Result<WebhookResponse, WebhookError>;
export type WebhookListResult = Result<WebhookResponse[], WebhookError>;
export type WebhookCreatedResult = Result<WebhookCreatedResponse, WebhookError>;
export type RotateWebhookSecretResult = Result<RotateWebhookSecretResponse, WebhookError>;
export type DeleteWebhookResult = Result<{ message: string }, WebhookError>;
export type WebhookDeliveryListResult = Result<WebhookDeliveryResponse[], WebhookError>;
export type RedeliverWebhookResult = Result<RedeliverWebhookResponse, WebhookError>;
