import { err, ok } from '../../../shared/result/result.js';
import type { IMetricsRepository } from '../repository/interface/metrics.repository.interface.js';
import { ApiKeyMetricsResponse } from '../responses/api-key-metrics.response.js';
import { ApplicationMetricsResponse } from '../responses/application-metrics.response.js';
import { AuthMetricsResponse } from '../responses/auth-metrics.response.js';
import { OAuthMetricsResponse } from '../responses/oauth-metrics.response.js';
import { OrganizationMetricsResponse } from '../responses/organization-metrics.response.js';
import { WebhookMetricsResponse } from '../responses/webhook-metrics.response.js';
import type {
  ApiKeyMetricsResult,
  ApplicationMetricsResult,
  AuthMetricsResult,
  OAuthMetricsResult,
  OrganizationMetricsResult,
  WebhookMetricsResult,
} from '../types/metrics.types.js';
import type { IMetricsService } from './interface/metrics.service.interface.js';

export class MetricsService implements IMetricsService {
  constructor(private readonly repository: IMetricsRepository) {}

  async getAuthMetrics(): Promise<AuthMetricsResult> {
    const found = await this.repository.getAuthMetrics();
    if (!found.ok) return err(found.error);

    const d = found.value;
    return ok(
      new AuthMetricsResponse(
        d.totalUsers,
        d.verifiedUsers,
        d.activeAccounts,
        d.deactivatedAccounts,
        d.lockedAccounts,
        d.signupsLast7Days,
        d.signupsLast30Days,
        d.loginsSucceededLast24h,
        d.loginsFailedLast24h,
      ),
    );
  }

  async getOAuthMetrics(): Promise<OAuthMetricsResult> {
    const found = await this.repository.getOAuthMetrics();
    if (!found.ok) return err(found.error);

    const d = found.value;
    return ok(
      new OAuthMetricsResponse(
        d.totalClients,
        d.activeClients,
        d.revokedClients,
        d.accessTokensIssuedLast24h,
        d.activeAccessTokens,
        d.activeRefreshTokens,
        d.authorizationCodesIssuedLast24h,
        d.tokensRevokedLast24h,
      ),
    );
  }

  async getApplicationMetrics(): Promise<ApplicationMetricsResult> {
    const found = await this.repository.getApplicationMetrics();
    if (!found.ok) return err(found.error);

    const d = found.value;
    return ok(
      new ApplicationMetricsResponse(
        d.total,
        d.active,
        d.inactive,
        d.createdLast7Days,
        d.createdLast30Days,
      ),
    );
  }

  async getApiKeyMetrics(): Promise<ApiKeyMetricsResult> {
    const found = await this.repository.getApiKeyMetrics();
    if (!found.ok) return err(found.error);

    const d = found.value;
    return ok(
      new ApiKeyMetricsResponse(
        d.total,
        d.active,
        d.revoked,
        d.expiringNext7Days,
        d.usedLast24h,
        d.neverUsed,
      ),
    );
  }

  async getWebhookMetrics(): Promise<WebhookMetricsResult> {
    const found = await this.repository.getWebhookMetrics();
    if (!found.ok) return err(found.error);

    const d = found.value;
    return ok(
      new WebhookMetricsResponse(
        d.totalWebhooks,
        d.activeWebhooks,
        d.disabledWebhooks,
        d.deliveriesByStatus,
        d.deliveriesLast24h,
        d.successRateLast24h,
      ),
    );
  }

  async getOrganizationMetrics(): Promise<OrganizationMetricsResult> {
    const found = await this.repository.getOrganizationMetrics();
    if (!found.ok) return err(found.error);

    const d = found.value;
    return ok(
      new OrganizationMetricsResponse(
        d.total,
        d.active,
        d.suspended,
        d.byPlan,
        d.createdLast7Days,
        d.createdLast30Days,
      ),
    );
  }
}
