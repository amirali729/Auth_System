import type { AdminListApiKeysDto } from '../../dto/list-api-keys.dto.js';
import type { AdminListApplicationsDto } from '../../dto/list-applications.dto.js';
import type { ListUsersDto } from '../../dto/list-users.dto.js';
import type { UpdateSystemSettingsDto } from '../../dto/update-system-settings.dto.js';
import type { UpdateUserDto } from '../../dto/update-user.dto.js';
import type {
  AdminApiKeyListResult,
  AdminApplicationListResult,
  AdminRevokeSessionResult,
  AdminSessionListResult,
  AdminUserDetailResult,
  AdminUserListResult,
  SystemSettingsResult,
} from '../../types/admin.types.js';
import type { PlatformRole } from '../../../../shared/security/authorization/platform-roles.js';
export interface IAdminService {
  listUsers(dto: ListUsersDto): Promise<AdminUserListResult>;

  getUserById(id: string): Promise<AdminUserDetailResult>;

  /**
   * `callerPlatformRole` is the ACTING admin's own role - required here
   * (not just at the route's requirePermission gate) because platform
   * role changes and actions against an Owner's account need a stricter,
   * code-level rule than a permission key can express: only an Owner
   * may change ANYONE's platformRole, and nobody but another Owner may
   * modify an Owner's account at all. See the Roles & Permissions doc,
   * section 4 ("Cannot: Promote Platform Owner, Demote Platform Owner")
   * and section 15.5 ("Only Platform Owner should perform these
   * actions").
   */
  updateUser(
    id: string,
    dto: UpdateUserDto,
    callerPlatformRole: PlatformRole,
    actorId?: string,
  ): Promise<AdminUserDetailResult>;

  listApplications(dto: AdminListApplicationsDto): Promise<AdminApplicationListResult>;

  listApiKeys(dto: AdminListApiKeysDto): Promise<AdminApiKeyListResult>;

  listSessionsForUser(userId: string): Promise<AdminSessionListResult>;

  revokeSession(
    userId: string,
    sessionId: string,
    actorId?: string,
  ): Promise<AdminRevokeSessionResult>;

  getSystemSettings(): Promise<SystemSettingsResult>;

  updateSystemSettings(
    dto: UpdateSystemSettingsDto,
    actorId: string,
  ): Promise<SystemSettingsResult>;
}
