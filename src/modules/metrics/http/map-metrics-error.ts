import { BaseErrorResponse } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/response/base.error.response.js';
import type { MetricsError } from '../types/metrics.types.js';

export function mapMetricsError(error: MetricsError): BaseErrorResponse {
  return new BaseErrorResponse(error.message, 500);
}
