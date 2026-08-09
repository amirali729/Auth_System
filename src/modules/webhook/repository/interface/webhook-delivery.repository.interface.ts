import type { InfrastructureError } from '../../../../shared/errors/infrastructure.error.js';
import type { Result } from '../../../../shared/result/result.js';
import type {
  IWebhookDelivery,
  WebhookDeliveryStatus,
} from '../../model/webhook-delivery.model.js';

export type DataResult<T> = Result<T, InfrastructureError>;

export interface IWebhookDeliveryRepository {
  /**
   * Idempotent get-or-create for a (webhookId, eventId) pair - if a
   * delivery row already exists (e.g. a redelivered domain event), the
   * existing row is returned unchanged rather than a duplicate being
   * created (see the model's unique index).
   */
  getOrCreate(data: {
    webhookId: string;
    organizationId: string;
    eventId: string;
    eventType: string;
    payload: Record<string, unknown>;
    maxAttempts: number;
  }): Promise<DataResult<IWebhookDelivery>>;

  findById(id: string): Promise<DataResult<IWebhookDelivery | null>>;

  findByWebhook(webhookId: string): Promise<DataResult<IWebhookDelivery[]>>;

  /** Rows due for a retry attempt right now - what the retry sweeper polls for. */
  findDueForRetry(): Promise<DataResult<IWebhookDelivery[]>>;

  markDelivering(id: string): Promise<DataResult<IWebhookDelivery | null>>;

  markDelivered(id: string, responseStatus: number): Promise<DataResult<IWebhookDelivery | null>>;

  markFailed(
    id: string,
    data: {
      responseStatus?: number;
      responseBody?: string;
      errorMessage: string;
      nextAttemptAt: Date | null;
    },
  ): Promise<DataResult<IWebhookDelivery | null>>;

  markDeadLetter(id: string, errorMessage: string): Promise<DataResult<IWebhookDelivery | null>>;

  /** Resets a delivery for manual redelivery - see the "Manual redelivery" requirement. */
  resetForRedelivery(id: string): Promise<DataResult<IWebhookDelivery | null>>;
}

export type { WebhookDeliveryStatus };
