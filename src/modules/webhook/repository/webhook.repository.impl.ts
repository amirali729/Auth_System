import { InfrastructureError } from '../../../shared/errors/infrastructure.error.js';
import { err, ok } from '../../../shared/result/result.js';
import type { IWebhook, WebhookStatus } from '../model/webhook.model.js';
import { Webhook } from '../model/webhook.model.js';
import type { DataResult, IWebhookRepository } from './interface/webhook.repository.interface.js';

export class WebhookRepository implements IWebhookRepository {
  async findByOrganization(organizationId: string): Promise<DataResult<IWebhook[]>> {
    try {
      const webhooks = await Webhook.find({ organizationId }).sort({ createdAt: -1 });
      return ok(webhooks);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async findById(id: string): Promise<DataResult<IWebhook | null>> {
    try {
      const webhook = await Webhook.findById(id);
      return ok(webhook);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async findActiveSubscribers(
    organizationId: string,
    eventType: string,
  ): Promise<DataResult<IWebhook[]>> {
    try {
      const webhooks = await Webhook.find({
        organizationId,
        status: 'active',
        subscribedEvents: { $in: [eventType, '*'] },
      });
      return ok(webhooks);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async create(data: {
    organizationId: string;
    name: string;
    url: string;
    secretEncrypted: string;
    subscribedEvents: string[];
  }): Promise<DataResult<IWebhook>> {
    try {
      const webhook = await Webhook.create(data);
      return ok(webhook);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async update(
    id: string,
    data: Partial<{ name: string; url: string; subscribedEvents: string[] }>,
  ): Promise<DataResult<IWebhook | null>> {
    try {
      const webhook = await Webhook.findByIdAndUpdate(id, data, { new: true });
      return ok(webhook);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async updateSecret(id: string, secretEncrypted: string): Promise<DataResult<IWebhook | null>> {
    try {
      const webhook = await Webhook.findByIdAndUpdate(id, { secretEncrypted }, { new: true });
      return ok(webhook);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async setStatus(id: string, status: WebhookStatus): Promise<DataResult<IWebhook | null>> {
    try {
      const webhook = await Webhook.findByIdAndUpdate(id, { status }, { new: true });
      return ok(webhook);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async delete(id: string): Promise<DataResult<boolean>> {
    try {
      const result = await Webhook.findByIdAndDelete(id);
      return ok(!!result);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async recordDeliveryOutcome(
    id: string,
    outcome: 'success' | 'failure',
  ): Promise<DataResult<IWebhook | null>> {
    try {
      const field = outcome === 'success' ? 'lastSuccessAt' : 'lastFailureAt';
      const webhook = await Webhook.findByIdAndUpdate(id, { [field]: new Date() }, { new: true });
      return ok(webhook);
    } catch {
      return err(new InfrastructureError());
    }
  }
}
