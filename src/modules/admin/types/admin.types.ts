import type { ForbiddenError } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/errors/forbidden.error.js';
import type { InfrastructureError } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/errors/infrastructure.error.js';
import type { NotFoundError } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/errors/not-found.error.js';
import type { ValidationError } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/errors/validation.error.js';
import type { Result } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/result/result.js';
import type { InvalidRefreshTokenError } from '../../../../../Auth_System_updated (2)/Auth_System/src/modules/session/errors/invalid-refresh-token.error.js';
import type { SessionExpiredError } from '../../../../../Auth_System_updated (2)/Auth_System/src/modules/session/errors/session-expired.error.js';
import type { SessionNotFoundError } from '../../../../../Auth_System_updated (2)/Auth_System/src/modules/session/errors/session-not-found.error.js';
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
