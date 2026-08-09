import { BaseErrorResponse } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/response/base.error.response.js';
import type { WebhookError } from '../types/webhook.types.js';

const errorMap: Record<WebhookError['kind'], (error: WebhookError) => BaseErrorResponse> = {
  webhook_not_found: (error) => new BaseErrorResponse(error.message, 404),

  webhook_delivery_not_found: (error) => new BaseErrorResponse(error.message, 404),

  organization_not_found: (error) => new BaseErrorResponse(error.message, 404),

  validation_error: (error) => new BaseErrorResponse(error.message, 400),

  infrastructure: (error) => new BaseErrorResponse(error.message, 500),
};

export function mapWebhookError(error: WebhookError): BaseErrorResponse {
  return errorMap[error.kind](error);
}
