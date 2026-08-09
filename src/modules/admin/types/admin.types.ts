import type { ForbiddenError } from '../../../shared/errors/forbidden.error.js';
import type { InfrastructureError } from '../../../shared/errors/infrastructure.error.js';
import type { NotFoundError } from '../../../shared/errors/not-found.error.js';
import type { ValidationError } from '../../../shared/errors/validation.error.js';
import type { Result } from '../../../shared/result/result.js';
import type { InvalidRefreshTokenError } from '../../session/errors/invalid-refresh-token.error.js';
import type { SessionExpiredError } from '../../session/errors/session-expired.error.ts';
import type { SessionNotFoundError } from '../../session/errors/session-not-found.error.js';
import type {
  AdminUserDetailResponse,
  AdminUserListResponse,
} from '../responses/admin-user.response.js';
import type { AdminApplicationListResponse } from '../responses/admin-application.response.js';
import type { AdminApiKeyListResponse } from '../responses/admin-api-key.response.js';
import type { AdminSessionListResponse } from '../responses/admin-session-list.response.js';
import type { SystemSettingsResponse } from '../responses/system-settings.response.js';

export type AdminError =
  | NotFoundError
  | ForbiddenError
  | ValidationError
  | InfrastructureError
  | SessionNotFoundError
  | InvalidRefreshTokenError
  | SessionExpiredError;

export type AdminUserListResult = Result<AdminUserListResponse, AdminError>;
export type AdminUserDetailResult = Result<AdminUserDetailResponse, AdminError>;
export type AdminApplicationListResult = Result<AdminApplicationListResponse, AdminError>;
export type AdminApiKeyListResult = Result<AdminApiKeyListResponse, AdminError>;
export type AdminSessionListResult = Result<AdminSessionListResponse, AdminError>;
export type AdminRevokeSessionResult = Result<{ message: string }, AdminError>;
export type SystemSettingsResult = Result<SystemSettingsResponse, AdminError>;
