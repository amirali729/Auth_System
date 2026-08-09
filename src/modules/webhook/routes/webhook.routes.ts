import { Router } from 'express';

import {
  WEBHOOK_CREATE,
  WEBHOOK_DELETE,
  WEBHOOK_DELIVERY_LIST,
  WEBHOOK_DELIVERY_REDELIVER,
  WEBHOOK_DISABLE,
  WEBHOOK_ENABLE,
  WEBHOOK_LIST,
  WEBHOOK_ROTATE_SECRET,
  WEBHOOK_UPDATE,
} from '../../../shared/api-endpoint/webhook.api.endpoint.js';
import { handle } from '../../../shared/http/handle.js';
import { HttpStatus } from '../../../shared/http/http-status.js';
import { validate } from '../../../shared/http/validate.js';
import { webhookManagementRateLimiter } from '../../../shared/security/middleware/rate-limit.middleware.js';
import { requirePermission } from '../../../shared/security/middleware/requirePermission.middleware.js';
import { resolveTenant } from '../../../shared/security/middleware/resolveTenant.middleware.js';
import { verifyjwt } from '../../../shared/security/middleware/verifyJwt.middleware.js';
import { auditService } from '../../audit/routes/audit.routes.js';
import { WebhookController } from '../controller/webhook.controller.impl.js';
import { mapWebhookError } from '../http/map-webhook-error.js';
import { WebhookDeliveryRepository } from '../repository/webhook-delivery.repository.impl.js';
import { WebhookRepository } from '../repository/webhook.repository.impl.js';
import { WebhookService } from '../service/webhook.service.impl.js';
import {
  createWebhookSchema,
  updateWebhookSchema,
  webhookDeliveryParamsSchema,
  webhookOrgParamsSchema,
  webhookParamsSchema,
} from '../validation/webhook.schemas.js';
// Same queue instance the retry sweep and the Event Bus dispatcher use
// (see bootstrap-webhook-delivery.ts) - a manual redelivery has to be
// enqueued on that one real queue, not a second disconnected instance.
import { webhookDeliveryQueue } from '../worker/bootstrap-webhook-delivery.js';

const router = Router();

const webhookRepository = new WebhookRepository();
const webhookDeliveryRepository = new WebhookDeliveryRepository();
const webhookService = new WebhookService(
  webhookRepository,
  auditService,
  webhookDeliveryRepository,
  webhookDeliveryQueue,
);
const webhookController = new WebhookController(webhookService);

router.use(verifyjwt, resolveTenant);

router.get(
  WEBHOOK_LIST,
  requirePermission('webhook:view'),
  validate({ params: webhookOrgParamsSchema }),
  handle(webhookController.list.bind(webhookController), mapWebhookError),
);

router.post(
  WEBHOOK_CREATE,
  webhookManagementRateLimiter,
  requirePermission('webhook:create'),
  validate({ params: webhookOrgParamsSchema, body: createWebhookSchema }),
  handle(webhookController.create.bind(webhookController), mapWebhookError, HttpStatus.CREATED),
);

router.patch(
  WEBHOOK_UPDATE,
  webhookManagementRateLimiter,
  requirePermission('webhook:update'),
  validate({ params: webhookParamsSchema, body: updateWebhookSchema }),
  handle(webhookController.update.bind(webhookController), mapWebhookError),
);

router.post(
  WEBHOOK_ROTATE_SECRET,
  webhookManagementRateLimiter,
  requirePermission('webhook:update'),
  validate({ params: webhookParamsSchema }),
  handle(webhookController.rotateSecret.bind(webhookController), mapWebhookError),
);

router.post(
  WEBHOOK_ENABLE,
  requirePermission('webhook:update'),
  validate({ params: webhookParamsSchema }),
  handle(webhookController.enable.bind(webhookController), mapWebhookError),
);

router.post(
  WEBHOOK_DISABLE,
  requirePermission('webhook:update'),
  validate({ params: webhookParamsSchema }),
  handle(webhookController.disable.bind(webhookController), mapWebhookError),
);

router.delete(
  WEBHOOK_DELETE,
  webhookManagementRateLimiter,
  requirePermission('webhook:delete'),
  validate({ params: webhookParamsSchema }),
  handle(webhookController.delete.bind(webhookController), mapWebhookError),
);

// Delivery history is a read - reuses the existing 'webhook:view'
// permission rather than introducing a new one, matching how CRUD reads
// are scoped elsewhere in this module.
router.get(
  WEBHOOK_DELIVERY_LIST,
  requirePermission('webhook:view'),
  validate({ params: webhookParamsSchema }),
  handle(webhookController.listDeliveries.bind(webhookController), mapWebhookError),
);

// Manual redelivery is its own distinct capability (least-privilege) -
// a caller with only 'webhook:view' can inspect delivery history but
// not trigger a resend.
router.post(
  WEBHOOK_DELIVERY_REDELIVER,
  webhookManagementRateLimiter,
  requirePermission('webhook:redeliver'),
  validate({ params: webhookDeliveryParamsSchema }),
  handle(webhookController.redeliver.bind(webhookController), mapWebhookError),
);

export default router;
