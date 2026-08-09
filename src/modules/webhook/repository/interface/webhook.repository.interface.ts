import type { InfrastructureError } from '../../../../shared/errors/infrastructure.error.js';
import type { Result } from '../../../../shared/result/result.js';
import type { IWebhook, WebhookStatus } from '../../model/webhook.model.js';

export type DataResult<T> = Result<T, InfrastructureError>;

export interface IWebhookRepository {
  findByOrganization(organizationId: string): Promise<DataResult<IWebhook[]>>;

  findById(id: string): Promise<DataResult<IWebhook | null>>;

  /**
   * Finds every ACTIVE webhook subscribed to a given event type within
   * one organization - this is the exact query the Webhook Dispatcher
   * (Phase 3c) will use to decide delivery targets. Matches either an
   * exact event-type string in subscribedEvents, or the '*' wildcard.
   */
  findActiveSubscribers(organizationId: string, eventType: string): Promise<DataResult<IWebhook[]>>;

  create(data: {
    organizationId: string;
    name: string;
    url: string;
    secretEncrypted: string;
    subscribedEvents: string[];
  }): Promise<DataResult<IWebhook>>;

  update(
    id: string,
    data: Partial<{ name: string; url: string; subscribedEvents: string[] }>,
  ): Promise<DataResult<IWebhook | null>>;

  updateSecret(id: string, secretEncrypted: string): Promise<DataResult<IWebhook | null>>;

  setStatus(id: string, status: WebhookStatus): Promise<DataResult<IWebhook | null>>;

  delete(id: string): Promise<DataResult<boolean>>;

  recordDeliveryOutcome(
    id: string,
    outcome: 'success' | 'failure',
  ): Promise<DataResult<IWebhook | null>>;
}
