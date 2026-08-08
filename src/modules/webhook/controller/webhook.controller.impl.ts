import type { NextFunction, Request, Response } from 'express';
import { CreateWebhookDto } from '../dto/create-webhook.dto.js';
import { UpdateWebhookDto } from '../dto/update-webhook.dto.js';
import type { IWebhookService } from '../service/interface/webhook.service.interface.js';
import type {
  DeleteWebhookResult,
  RedeliverWebhookResult,
  RotateWebhookSecretResult,
  WebhookCreatedResult,
  WebhookDeliveryListResult,
  WebhookListResult,
  WebhookResult,
} from '../types/webhook.types.js';
import type { IWebhookController } from './interface/webhook.controller.interface.js';

export class WebhookController implements IWebhookController {
  constructor(private readonly service: IWebhookService) {}

  async list(req: Request, _res: Response, _next: NextFunction): Promise<WebhookListResult> {
    return this.service.list(req.params.orgId as string, req.tenantId, req.user._id.toString());
  }

  async create(req: Request, _res: Response, _next: NextFunction): Promise<WebhookCreatedResult> {
    const dto = new CreateWebhookDto(req.body.name, req.body.url, req.body.subscribedEvents);
    return this.service.create(
      req.params.orgId as string,
      dto,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async update(req: Request, _res: Response, _next: NextFunction): Promise<WebhookResult> {
    const dto = new UpdateWebhookDto(req.body.name, req.body.url, req.body.subscribedEvents);
    return this.service.update(
      req.params.orgId as string,
      req.params.webhookId as string,
      dto,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async rotateSecret(
    req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<RotateWebhookSecretResult> {
    return this.service.rotateSecret(
      req.params.orgId as string,
      req.params.webhookId as string,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async enable(req: Request, _res: Response, _next: NextFunction): Promise<WebhookResult> {
    return this.service.enable(
      req.params.orgId as string,
      req.params.webhookId as string,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async disable(req: Request, _res: Response, _next: NextFunction): Promise<WebhookResult> {
    return this.service.disable(
      req.params.orgId as string,
      req.params.webhookId as string,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async delete(req: Request, _res: Response, _next: NextFunction): Promise<DeleteWebhookResult> {
    return this.service.delete(
      req.params.orgId as string,
      req.params.webhookId as string,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async listDeliveries(
    req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<WebhookDeliveryListResult> {
    return this.service.listDeliveries(
      req.params.orgId as string,
      req.params.webhookId as string,
      req.tenantId,
      req.user._id.toString(),
    );
  }

  async redeliver(
    req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<RedeliverWebhookResult> {
    return this.service.redeliver(
      req.params.orgId as string,
      req.params.webhookId as string,
      req.params.deliveryId as string,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }
}
