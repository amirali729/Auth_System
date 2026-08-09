import { User } from '../../auth/model/user.model.js';
import { AuditLog } from '../../audit/model/audit-log.model.js';
import { AuthorizationCode } from '../../oauth/model/authorization-code.model.js';
import { OAuthAccessToken } from '../../oauth/model/oauth-access-token.model.js';
import { OAuthClient } from '../../oauth/model/oauth-client.model.js';
import { OAuthRefreshToken } from '../../oauth/model/oauth-refresh-token.model.js';
import { Application } from '../../application/model/application.model.js';
import { ApiKey } from '../../apikey/model/api-key.model.js';
import { Webhook } from '../../webhook/model/webhook.model.js';
import { WebhookDelivery } from '../../webhook/model/webhook-delivery.model.js';
import { Tenant } from '../../organizations/model/organization.model.js';

import { InfrastructureError } from '../../../shared/errors/infrastructure.error.js';
import { err, ok } from '../../../shared/result/result.js';

import type {
  ApiKeyMetricsData,
  ApplicationMetricsData,
  AuthMetricsData,
  OAuthMetricsData,
  OrganizationMetricsData,
  WebhookMetricsData,
} from '../types/metrics.types.js';
import type { DataResult, IMetricsRepository } from './interface/metrics.repository.interface.js';

const DAY_MS = 86_400_000;

/**
 * Every method here is a handful of independent countDocuments() calls
 * run in parallel, deliberately NOT funneled through each owning
 * module's CRUD repository - those interfaces model "fetch/mutate one
 * tenant's records" (see e.g. IApplicationRepository.findAll(tenantId)),
 * not "count everything platform-wide", and bending them to do both
 * would leak a reporting concern into every other module's contract.
 * Direct, read-only model access here mirrors the same choice already
 * made in dashboard.service.impl.ts's activity/system-health widgets.
 */
export class MetricsRepository implements IMetricsRepository {
  async getAuthMetrics(): Promise<DataResult<AuthMetricsData>> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
      const twentyFourHoursAgo = new Date(now.getTime() - DAY_MS);

      const [
        totalUsers,
        verifiedUsers,
        deactivatedAccounts,
        lockedAccounts,
        signupsLast7Days,
        signupsLast30Days,
        loginsSucceededLast24h,
        loginsFailedLast24h,
      ] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ isVerified: true }),
        User.countDocuments({ status: 'deactivated' }),
        User.countDocuments({ lockUntil: { $gt: now } }),
        User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        AuditLog.countDocuments({
          action: 'auth.login',
          success: true,
          createdAt: { $gte: twentyFourHoursAgo },
        }),
        AuditLog.countDocuments({
          action: 'auth.login',
          success: false,
          createdAt: { $gte: twentyFourHoursAgo },
        }),
      ]);

      return ok({
        totalUsers,
        verifiedUsers,
        activeAccounts: totalUsers - deactivatedAccounts,
        deactivatedAccounts,
        lockedAccounts,
        signupsLast7Days,
        signupsLast30Days,
        loginsSucceededLast24h,
        loginsFailedLast24h,
      });
    } catch {
      return err(new InfrastructureError());
    }
  }

  async getOAuthMetrics(): Promise<DataResult<OAuthMetricsData>> {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - DAY_MS);

      const [
        totalClients,
        activeClients,
        revokedClients,
        accessTokensIssuedLast24h,
        activeAccessTokens,
        activeRefreshTokens,
        authorizationCodesIssuedLast24h,
        tokensRevokedLast24h,
      ] = await Promise.all([
        OAuthClient.countDocuments({}),
        OAuthClient.countDocuments({ status: 'active' }),
        OAuthClient.countDocuments({ status: 'revoked' }),
        OAuthAccessToken.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
        OAuthAccessToken.countDocuments({ revokedAt: null, expiresAt: { $gt: now } }),
        OAuthRefreshToken.countDocuments({ revokedAt: null, expiresAt: { $gt: now } }),
        AuthorizationCode.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
        // Access + refresh token revocations are both recorded via the
        // same 'oauth_token.revoked' audit action (see
        // oauth-token.service.impl.ts) - one count covers both.
        AuditLog.countDocuments({
          action: 'oauth_token.revoked',
          createdAt: { $gte: twentyFourHoursAgo },
        }),
      ]);

      return ok({
        totalClients,
        activeClients,
        revokedClients,
        accessTokensIssuedLast24h,
        activeAccessTokens,
        activeRefreshTokens,
        authorizationCodesIssuedLast24h,
        tokensRevokedLast24h,
      });
    } catch {
      return err(new InfrastructureError());
    }
  }

  async getApplicationMetrics(): Promise<DataResult<ApplicationMetricsData>> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

      const [total, active, createdLast7Days, createdLast30Days] = await Promise.all([
        Application.countDocuments({}),
        Application.countDocuments({ isActive: true }),
        Application.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        Application.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      ]);

      return ok({ total, active, inactive: total - active, createdLast7Days, createdLast30Days });
    } catch {
      return err(new InfrastructureError());
    }
  }

  async getApiKeyMetrics(): Promise<DataResult<ApiKeyMetricsData>> {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * DAY_MS);
      const twentyFourHoursAgo = new Date(now.getTime() - DAY_MS);

      const [total, active, revoked, expiringNext7Days, usedLast24h, neverUsed] = await Promise.all(
        [
          ApiKey.countDocuments({}),
          ApiKey.countDocuments({ status: 'active' }),
          ApiKey.countDocuments({ status: 'revoked' }),
          ApiKey.countDocuments({
            status: 'active',
            expiresAt: { $gt: now, $lte: sevenDaysFromNow },
          }),
          ApiKey.countDocuments({ lastUsedAt: { $gte: twentyFourHoursAgo } }),
          ApiKey.countDocuments({ lastUsedAt: { $exists: false } }),
        ],
      );

      return ok({ total, active, revoked, expiringNext7Days, usedLast24h, neverUsed });
    } catch {
      return err(new InfrastructureError());
    }
  }

  async getWebhookMetrics(): Promise<DataResult<WebhookMetricsData>> {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - DAY_MS);

      const [
        totalWebhooks,
        activeWebhooks,
        pending,
        delivering,
        delivered,
        failed,
        deadLetter,
        deliveriesLast24h,
        deliveredLast24h,
        failedLast24h,
        deadLetterLast24h,
      ] = await Promise.all([
        Webhook.countDocuments({}),
        Webhook.countDocuments({ status: 'active' }),
        WebhookDelivery.countDocuments({ status: 'pending' }),
        WebhookDelivery.countDocuments({ status: 'delivering' }),
        WebhookDelivery.countDocuments({ status: 'delivered' }),
        WebhookDelivery.countDocuments({ status: 'failed' }),
        WebhookDelivery.countDocuments({ status: 'dead_letter' }),
        WebhookDelivery.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
        WebhookDelivery.countDocuments({
          status: 'delivered',
          updatedAt: { $gte: twentyFourHoursAgo },
        }),
        WebhookDelivery.countDocuments({
          status: 'failed',
          updatedAt: { $gte: twentyFourHoursAgo },
        }),
        WebhookDelivery.countDocuments({
          status: 'dead_letter',
          updatedAt: { $gte: twentyFourHoursAgo },
        }),
      ]);

      const terminalLast24h = deliveredLast24h + failedLast24h + deadLetterLast24h;
      const successRateLast24h =
        terminalLast24h > 0
          ? Math.round((deliveredLast24h / terminalLast24h) * 10_000) / 100
          : null;

      return ok({
        totalWebhooks,
        activeWebhooks,
        disabledWebhooks: totalWebhooks - activeWebhooks,
        deliveriesByStatus: {
          pending,
          delivering,
          delivered,
          failed,
          dead_letter: deadLetter,
        },
        deliveriesLast24h,
        successRateLast24h,
      });
    } catch {
      return err(new InfrastructureError());
    }
  }

  async getOrganizationMetrics(): Promise<DataResult<OrganizationMetricsData>> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

      const [total, active, free, pro, enterprise, createdLast7Days, createdLast30Days] =
        await Promise.all([
          Tenant.countDocuments({}),
          Tenant.countDocuments({ status: 'active' }),
          Tenant.countDocuments({ plan: 'free' }),
          Tenant.countDocuments({ plan: 'pro' }),
          Tenant.countDocuments({ plan: 'enterprise' }),
          Tenant.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
          Tenant.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        ]);

      return ok({
        total,
        active,
        suspended: total - active,
        byPlan: { free, pro, enterprise },
        createdLast7Days,
        createdLast30Days,
      });
    } catch {
      return err(new InfrastructureError());
    }
  }
}
