import type {
  ApiKeyMetricsResult,
  ApplicationMetricsResult,
  AuthMetricsResult,
  OAuthMetricsResult,
  OrganizationMetricsResult,
  WebhookMetricsResult,
} from '../../types/metrics.types.js';

export interface IMetricsService {
  getAuthMetrics(): Promise<AuthMetricsResult>;

  getOAuthMetrics(): Promise<OAuthMetricsResult>;

  getApplicationMetrics(): Promise<ApplicationMetricsResult>;

  getApiKeyMetrics(): Promise<ApiKeyMetricsResult>;

  getWebhookMetrics(): Promise<WebhookMetricsResult>;

  getOrganizationMetrics(): Promise<OrganizationMetricsResult>;
}
