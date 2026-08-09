import { BaseErrorResponse } from '../../../shared/response/base.error.response.js';
import type { MetricsError } from '../types/metrics.types.js';

export function mapMetricsError(error: MetricsError): BaseErrorResponse {
  return new BaseErrorResponse(error.message, 500);
}
