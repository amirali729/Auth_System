import { Router } from 'express';

import { MetricsController } from '../controller/metrics.controller.impl.js';
import { mapMetricsError } from '../http/map-metrics-error.js';
import { MetricsRepository } from '../repository/metrics.repository.impl.js';
import { MetricsService } from '../service/metrics.service.impl.js';

import { handle } from '../../../shared/http/handle.js';
import { requirePermission } from '../../../shared/security/middleware/requirePermission.middleware.js';
import { verifyjwt } from '../../../shared/security/middleware/verifyJwt.middleware.js';

import {
  METRICS_API_KEYS,
  METRICS_APPLICATIONS,
  METRICS_AUTH,
  METRICS_OAUTH,
  METRICS_ORGANIZATIONS,
  METRICS_WEBHOOKS,
} from '../../../shared/api-endpoint/metrics.api.endpoint.js';

const router = Router();

const metricsRepository = new MetricsRepository();
const metricsService = new MetricsService(metricsRepository);
const metricsController = new MetricsController(metricsService);

// Every metric here is platform-wide (every user, every organization,
// every application) - not scoped to a caller's own organization - so
// this is gated by the 'metrics:view' PLATFORM permission (Platform
// Admin/Support - see platform-roles.ts), not a per-tenant one. No
// resolveTenant here: a resolved tenant would be misleading, since
// nothing below is filtered by it.
router.use(verifyjwt, requirePermission('metrics:view'));

router.get(METRICS_AUTH, handle(metricsController.auth.bind(metricsController), mapMetricsError));

router.get(METRICS_OAUTH, handle(metricsController.oauth.bind(metricsController), mapMetricsError));

router.get(
  METRICS_APPLICATIONS,
  handle(metricsController.applications.bind(metricsController), mapMetricsError),
);

router.get(
  METRICS_API_KEYS,
  handle(metricsController.apiKeys.bind(metricsController), mapMetricsError),
);

router.get(
  METRICS_WEBHOOKS,
  handle(metricsController.webhooks.bind(metricsController), mapMetricsError),
);

router.get(
  METRICS_ORGANIZATIONS,
  handle(metricsController.organizations.bind(metricsController), mapMetricsError),
);

export default router;
