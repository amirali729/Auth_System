import { z } from 'zod';
import { DOMAIN_EVENTS } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/events/domain-events.js';
import { objectIdSchema } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/validation/object-id.schema.js';

const KNOWN_EVENT_TYPES = new Set<string>(Object.values(DOMAIN_EVENTS));

const eventTypeSchema = z
  .string()
  .refine((value) => value === '*' || KNOWN_EVENT_TYPES.has(value), {
    message: 'Not a recognized event type (or "*" for all events).',
  });

export const createWebhookSchema = z.object({
  name: z.string().trim().min(2, 'Webhook name must be at least 2 characters.').max(100),
  url: z.string().url('url must be a valid URL.'),
  subscribedEvents: z
    .array(eventTypeSchema)
    .min(1, 'At least one subscribed event (or "*") is required.'),
});

export const updateWebhookSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  url: z.string().url('url must be a valid URL.').optional(),
  subscribedEvents: z.array(eventTypeSchema).min(1).optional(),
});

export const webhookOrgParamsSchema = z.object({
  orgId: objectIdSchema,
});

export const webhookParamsSchema = z.object({
  orgId: objectIdSchema,
  webhookId: objectIdSchema,
});

export const webhookDeliveryParamsSchema = z.object({
  orgId: objectIdSchema,
  webhookId: objectIdSchema,
  deliveryId: objectIdSchema,
});
