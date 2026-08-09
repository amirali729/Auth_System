import { BaseErrorResponse } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/response/base.error.response.js';
import type { AdminError } from '../types/admin.types.js';

const errorMap: Record<AdminError['kind'], (error: AdminError) => BaseErrorResponse> = {
  not_found: (error) => new BaseErrorResponse(error.message, 404),
  forbidden: (error) => new BaseErrorResponse(error.message, 403),
  validation_error: (error) => new BaseErrorResponse(error.message, 400),
  infrastructure: (error) => new BaseErrorResponse(error.message, 500),
  session_not_found: (error) => new BaseErrorResponse(error.message, 404),
  invalid_refresh_token: (error) => new BaseErrorResponse(error.message, 401),
  session_expired: (error) => new BaseErrorResponse(error.message, 401),
};

export function mapAdminError(error: AdminError): BaseErrorResponse {
  return errorMap[error.kind](error);
}
