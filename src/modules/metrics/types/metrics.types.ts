import type { InfrastructureError } from '../../../shared/errors/infrastructure.error.js';
import type { Result } from '../../../shared/result/result.js';
import type { ApiKeyMetricsResponse } from '../responses/api-key-metrics.response.js';
import type { ApplicationMetricsResponse } from '../responses/application-metrics.response.js';
import type { AuthMetricsResponse } from '../responses/auth-metrics.response.js';
import type { OAuthMetricsResponse } from '../responses/oauth-metrics.response.js';
import type { OrganizationMetricsResponse } from '../responses/organization-metrics.response.js';
import type { WebhookMetricsResponse } from '../responses/webhook-metrics.response.js';

/**
 * Every metric here is a read-only count/aggregate over data the caller
 * (a Platform Admin/Support user - see routes/metrics.routes.ts) is
 * already entitled to see in full; there is no per-record ownership
 * check that can fail, so InfrastructureError is the only failure mode
 * this module itself introduces.
 */
export type MetricsError = InfrastructureError;

export type AuthMetricsResult = Result<AuthMetricsResponse, MetricsError>;
export type OAuthMetricsResult = Result<OAuthMetricsResponse, MetricsError>;
export type ApplicationMetricsResult = Result<ApplicationMetricsResponse, MetricsError>;
export type ApiKeyMetricsResult = Result<ApiKeyMetricsResponse, MetricsError>;
export type WebhookMetricsResult = Result<WebhookMetricsResponse, MetricsError>;
export type OrganizationMetricsResult = Result<OrganizationMetricsResponse, MetricsError>;

export interface AuthMetricsData {
  totalUsers: number;
  verifiedUsers: number;
  activeAccounts: number;
  deactivatedAccounts: number;
  lockedAccounts: number;
  signupsLast7Days: number;
  signupsLast30Days: number;
  loginsSucceededLast24h: number;
  loginsFailedLast24h: number;
}

export interface OAuthMetricsData {
  totalClients: number;
  activeClients: number;
  revokedClients: number;
  accessTokensIssuedLast24h: number;
  activeAccessTokens: number;
  activeRefreshTokens: number;
  authorizationCodesIssuedLast24h: number;
  tokensRevokedLast24h: number;
}

export interface ApplicationMetricsData {
  total: number;
  active: number;
  inactive: number;
  createdLast7Days: number;
  createdLast30Days: number;
}

export interface ApiKeyMetricsData {
  total: number;
  active: number;
  revoked: number;
  expiringNext7Days: number;
  usedLast24h: number;
  neverUsed: number;
}

export interface WebhookMetricsData {
  totalWebhooks: number;
  activeWebhooks: number;
  disabledWebhooks: number;
  deliveriesByStatus: {
    pending: number;
    delivering: number;
    delivered: number;
    failed: number;
    dead_letter: number;
  };
  deliveriesLast24h: number;
  successRateLast24h: number | null;
}

export interface OrganizationMetricsData {
  total: number;
  active: number;
  suspended: number;
  byPlan: { free: number; pro: number; enterprise: number };
  createdLast7Days: number;
  createdLast30Days: number;
}
