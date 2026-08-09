import type { CreateWebhookDto } from '../../dto/create-webhook.dto.js';
import type { UpdateWebhookDto } from '../../dto/update-webhook.dto.js';
import type {
  DeleteWebhookResult,
  RedeliverWebhookResult,
  RotateWebhookSecretResult,
  WebhookCreatedResult,
  WebhookDeliveryListResult,
  WebhookListResult,
  WebhookResult,
} from '../../types/webhook.types.js';

export interface IWebhookService {
  list(
    organizationId: string,
    callerTenantId: string | undefined,
    callerId: string,
  ): Promise<WebhookListResult>;

  create(
    organizationId: string,
    dto: CreateWebhookDto,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<WebhookCreatedResult>;

  update(
    organizationId: string,
    webhookId: string,
    dto: UpdateWebhookDto,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<WebhookResult>;

  rotateSecret(
    organizationId: string,
    webhookId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<RotateWebhookSecretResult>;

  enable(
    organizationId: string,
    webhookId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<WebhookResult>;

  disable(
    organizationId: string,
    webhookId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<WebhookResult>;

  delete(
    organizationId: string,
    webhookId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<DeleteWebhookResult>;

  listDeliveries(
    organizationId: string,
    webhookId: string,
    callerTenantId: string | undefined,
    callerId: string,
  ): Promise<WebhookDeliveryListResult>;

  redeliver(
    organizationId: string,
    webhookId: string,
    deliveryId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<RedeliverWebhookResult>;
}
