import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import adminRouter from './modules/admin/routes/admin.routes.js';
import apiKeyRouter from './modules/apikey/routes/api-key.routes.js';
import applicationRouter from './modules/application/routes/application.routes.js';
import auditRouter from './modules/audit/routes/audit.routes.js';
import authRouter from './modules/auth/routes/auth.routes.js';
import dashboardRouter from './modules/dashboard/routes/dashboard.routes.js';
import invitationPublicRouter from './modules/invitation/routes/invitation-public.routes.js';
import invitationRouter from './modules/invitation/routes/invitation.routes.js';
import membershipRouter from './modules/membership/routes/membership.routes.js';
import metricsRouter from './modules/metrics/routes/metrics.routes.js';
import authorizeRouter from './modules/oauth/routes/authorize.routes.js';
import discoveryRouter from './modules/oauth/routes/discovery.routes.js';
import oauthClientRouter from './modules/oauth/routes/oauth-client.routes.js';
import tokenRouter from './modules/oauth/routes/token.routes.js';
import organizationRouter from './modules/organizations/routes/organization.routes.js';
import permissionRouter from './modules/permission/routes/permission.routes.js';
import roleRouter from './modules/role/routes/role.routes.js';
import sessionRouter from './modules/session/routes/session.routes.js';
import settingsRouter from './modules/settings/routes/settings.routes.js';
import webhookRouter from './modules/webhook/routes/webhook.routes.js';
import { bootstrapWebhookDelivery } from './modules/webhook/worker/bootstrap-webhook-delivery.js';
import healthRouter from './shared/http/health.router.js';
import swaggerRouter from './shared/openapi/swagger.routes.js';

import { parseCorsOrigins } from './shared/config/cors-origins.js';
import './shared/events/event-bus.js';
import { errorHandler, notFoundHandler } from './shared/http/error-handler.js';
import { globalRateLimiter } from './shared/security/middleware/rate-limit.middleware.js';
import { Logger } from './shared/utils/logger.js';

export function createApp() {
  const app = express();

  // Off by default: enabling this blindly would let ANY client spoof
  // its IP via X-Forwarded-For, which would let them bypass per-IP
  // rate limiting (item 15/17) and forge the IP that ends up in audit
  // logs. Only turn it on (TRUST_PROXY=true) when this app is actually
  // behind a real reverse proxy/load balancer that sets that header
  // itself and strips any client-supplied one. When enabled, `1` trusts
  // exactly one hop (the immediate proxy), not the whole chain.
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }

  // Throws with a clear message if CORS_ORIGIN is missing, "*", or
  // otherwise malformed - see cors-origins.ts for why "*" is rejected
  // outright (it's incompatible with credentials: true below). This is
  // also checked once at boot by validateEnv(), so in practice this
  // should never throw here - this is defense in depth in case
  // createApp() is ever called without going through load-env.js first.
  const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);

  // Security headers (HSTS, X-Content-Type-Options, etc.). CSP is
  // disabled because Swagger UI (mounted below at /api/docs) needs
  // inline scripts/styles to render; this is an API service with no
  // other browser-rendered surface, so the trade-off is acceptable.
  app.use(helmet({ contentSecurityPolicy: false }));

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header at all means this isn't a browser
        // cross-origin request (server-to-server calls, curl, mobile
        // apps, same-origin requests) - nothing to enforce here.
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) return callback(null, true);

        return callback(new Error(`CORS: origin "${origin}" is not allowed.`));
      },
      credentials: true,
    }),
  );

  // Request logging - routed through the shared Logger so log format
  // stays consistent whether it comes from morgan or app code.
  //
  // Logs the path only, not the query string: several endpoints accept
  // sensitive one-time tokens (email verification, password reset) as
  // query params for link-based flows, and morgan's default :url token
  // would otherwise write those straight into the logs in plaintext.
  morgan.token<express.Request, express.Response>(
    'safe-url',
    (req) => req.originalUrl.split('?')[0] ?? req.originalUrl,
  );

  app.use(
    morgan(':method :safe-url :status :res[content-length] - :response-time ms', {
      stream: {
        write: (message) => Logger.info(message.trim()),
      },
    }),
  );

  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: true, limit: '16kb' }));
  app.use(express.static('public'));
  app.use(cookieParser());

  // Backstop rate limit across the whole API; individual auth routes
  // layer stricter limits on top (see auth.router.ts).
  app.use(globalRateLimiter);

  app.use('/health', healthRouter);
  app.use('/api/docs', swaggerRouter);

  // Mounted first, deliberately: several routers below apply verifyjwt
  // via router.use() with no path filter, which matches every path
  // under their mount point - not just their own routes. If this were
  // mounted after any of them, this public route would never be
  // reached (see invitation-public.routes.ts for the full explanation).
  app.use('/api/v1', invitationPublicRouter);

  app.use('/api/v1', authRouter);
  app.use('/api/v1', permissionRouter);
  app.use('/api/v1', roleRouter);
  app.use('/api/v1', organizationRouter);
  app.use('/api/v1', membershipRouter);
  app.use('/api/v1', invitationRouter);
  app.use('/api/v1', applicationRouter);
  app.use('/api/v1', apiKeyRouter);
  app.use('/api/v1', oauthClientRouter);
  app.use(authorizeRouter);
  app.use(tokenRouter);
  app.use(discoveryRouter);
  app.use('/api/v1', sessionRouter);
  app.use('/api/v1', auditRouter);
  app.use('/api/v1', webhookRouter);
  app.use('/api/v1', settingsRouter);
  app.use('/api/v1', dashboardRouter);
  app.use('/api/v1', metricsRouter);
  app.use('/api/v1', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  // Subscribes the Webhook Dispatcher to the Event Bus singleton and
  // starts the delivery retry sweep - without this call nothing is
  // actually listening on the bus for webhook delivery, even though the
  // CRUD routes above and the event-bus import at the top of this file
  // are both wired up. Idempotent (see bootstrap-webhook-delivery.ts).
  bootstrapWebhookDelivery();

  return app;
}
