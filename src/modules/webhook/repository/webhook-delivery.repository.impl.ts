import { InfrastructureError } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/errors/infrastructure.error.js';
import {
  err,
  ok,
} from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/result/result.js';
import type { IWebhookDelivery } from '../model/webhook-delivery.model.js';
import { WebhookDelivery } from '../model/webhook-delivery.model.js';
import type {
  DataResult,
  IWebhookDeliveryRepository,
} from './interface/webhook-delivery.repository.interface.js';

export class WebhookDeliveryRepository implements IWebhookDeliveryRepository {
  async getOrCreate(data: {
    webhookId: string;
    organizationId: string;
    eventId: string;
    eventType: string;
    payload: Record<string, unknown>;
    maxAttempts: number;
  }): Promise<DataResult<IWebhookDelivery>> {
    try {
      // upsert + $setOnInsert: if a row for (webhookId, eventId) already
      // exists, it's returned untouched - this IS the idempotency
      // guarantee (see the model's unique index), not just a
      // performance shortcut.
      const delivery = await WebhookDelivery.findOneAndUpdate(
        { webhookId: data.webhookId, eventId: data.eventId },
        {
          $setOnInsert: {
            organizationId: data.organizationId,
            eventType: data.eventType,
            payload: data.payload,
            status: 'pending',
            attempts: 0,
            maxAttempts: data.maxAttempts,
          },
        },
        { upsert: true, new: true },
      );
      return ok(delivery);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async findById(id: string): Promise<DataResult<IWebhookDelivery | null>> {
    try {
      const delivery = await WebhookDelivery.findById(id);
      return ok(delivery);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async findByWebhook(webhookId: string): Promise<DataResult<IWebhookDelivery[]>> {
    try {
      const deliveries = await WebhookDelivery.find({ webhookId })
        .sort({ createdAt: -1 })
        .limit(200);
      return ok(deliveries);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async findDueForRetry(): Promise<DataResult<IWebhookDelivery[]>> {
    try {
      const deliveries = await WebhookDelivery.find({
        status: { $in: ['pending', 'failed'] },
        nextAttemptAt: { $lte: new Date() },
      }).limit(100);
      return ok(deliveries);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async markDelivering(id: string): Promise<DataResult<IWebhookDelivery | null>> {
    try {
      const delivery = await WebhookDelivery.findByIdAndUpdate(
        id,
        { status: 'delivering', $inc: { attempts: 1 }, lastAttemptAt: new Date() },
        { new: true },
      );
      return ok(delivery);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async markDelivered(
    id: string,
    responseStatus: number,
  ): Promise<DataResult<IWebhookDelivery | null>> {
    try {
      const delivery = await WebhookDelivery.findByIdAndUpdate(
        id,
        { status: 'delivered', responseStatus, nextAttemptAt: null, errorMessage: null },
        { new: true },
      );
      return ok(delivery);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async markFailed(
    id: string,
    data: {
      responseStatus?: number;
      responseBody?: string;
      errorMessage: string;
      nextAttemptAt: Date | null;
    },
  ): Promise<DataResult<IWebhookDelivery | null>> {
    try {
      const delivery = await WebhookDelivery.findByIdAndUpdate(
        id,
        {
          status: 'failed',
          responseStatus: data.responseStatus ?? null,
          responseBody: data.responseBody?.slice(0, 2000) ?? null,
          errorMessage: data.errorMessage,
          nextAttemptAt: data.nextAttemptAt,
        },
        { new: true },
      );
      return ok(delivery);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async markDeadLetter(
    id: string,
    errorMessage: string,
  ): Promise<DataResult<IWebhookDelivery | null>> {
    try {
      const delivery = await WebhookDelivery.findByIdAndUpdate(
        id,
        { status: 'dead_letter', errorMessage, nextAttemptAt: null },
        { new: true },
      );
      return ok(delivery);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async resetForRedelivery(id: string): Promise<DataResult<IWebhookDelivery | null>> {
    try {
      const delivery = await WebhookDelivery.findByIdAndUpdate(
        id,
        { status: 'pending', nextAttemptAt: new Date(), errorMessage: null },
        { new: true },
      );
      return ok(delivery);
    } catch {
      return err(new InfrastructureError());
    }
  }
}
