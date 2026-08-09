import type { InfrastructureError } from '../../../../../../Auth_System_updated (2)/Auth_System/src/shared/errors/infrastructure.error.js';
import type { Result } from '../../../../../../Auth_System_updated (2)/Auth_System/src/shared/result/result.js';
import type {
  ApiKeyMetricsData,
  ApplicationMetricsData,
  AuthMetricsData,
  OAuthMetricsData,
  OrganizationMetricsData,
  WebhookMetricsData,
} from '../../types/metrics.types.js';

export type DataResult<T> = Result<T, InfrastructureError>;

export interface IMetricsRepository {
  getAuthMetrics(): Promise<DataResult<AuthMetricsData>>;

  getOAuthMetrics(): Promise<DataResult<OAuthMetricsData>>;

  getApplicationMetrics(): Promise<DataResult<ApplicationMetricsData>>;

  getApiKeyMetrics(): Promise<DataResult<ApiKeyMetricsData>>;

  getWebhookMetrics(): Promise<DataResult<WebhookMetricsData>>;

  getOrganizationMetrics(): Promise<DataResult<OrganizationMetricsData>>;
}
