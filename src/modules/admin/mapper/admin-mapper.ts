import type { IApiKey } from '../../apikey/model/api-key.model.js';
import type { IApplication } from '../../application/model/application.model.js';
import type { IUser } from '../../auth/model/user.model.js';
import type { AdminUserOrganizationSummary } from '../responses/admin-user.response.js';
import { AdminUserDetailResponse, AdminUserResponse } from '../responses/admin-user.response.js';
import { AdminApiKeyResponse } from '../responses/admin-api-key.response.js';
import { AdminApplicationResponse } from '../responses/admin-application.response.js';
import type { ISystemSettings } from '../model/system-settings.model.js';
import { SystemSettingsResponse } from '../responses/system-settings.response.js';

export function toAdminUserResponse(user: IUser): AdminUserResponse {
  return new AdminUserResponse(
    user._id.toString(),
    user.username,
    user.email,
    user.fullName,
    user.platformRole,
    user.status,
    user.isVerified,
    user.failedLoginAttempts,
    user.lockUntil,
    user.createdAt,
  );
}

export function toAdminUserDetailResponse(
  user: IUser,
  organizations: AdminUserOrganizationSummary[],
): AdminUserDetailResponse {
  return new AdminUserDetailResponse(
    user._id.toString(),
    user.username,
    user.email,
    user.fullName,
    user.platformRole,
    user.status,
    user.isVerified,
    user.failedLoginAttempts,
    user.lockUntil,
    user.createdAt,
    organizations,
  );
}

export function toAdminApplicationResponse(application: IApplication): AdminApplicationResponse {
  return new AdminApplicationResponse(
    application._id.toString(),
    application.tenantId?.toString(),
    application.name,
    application.clientId,
    application.isActive,
    application.createdAt,
  );
}

export function toAdminApiKeyResponse(apiKey: IApiKey): AdminApiKeyResponse {
  return new AdminApiKeyResponse(
    apiKey._id.toString(),
    apiKey.applicationId.toString(),
    apiKey.name,
    apiKey.keyPrefix,
    apiKey.status,
    apiKey.expiresAt,
    apiKey.lastUsedAt,
    apiKey.createdAt,
  );
}

export function toSystemSettingsResponse(settings: ISystemSettings): SystemSettingsResponse {
  return new SystemSettingsResponse(
    settings.allowSignups,
    settings.maintenanceMode,
    settings.maintenanceMessage,
    settings.defaultOrganizationPlan,
    settings.supportEmail,
    settings.updatedAt,
  );
}
