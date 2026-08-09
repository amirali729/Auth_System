import { ForbiddenError } from '../../../shared/errors/forbidden.error.js';
import { NotFoundError } from '../../../shared/errors/not-found.error.js';
import { err, ok } from '../../../shared/result/result.js';

import { RecordAuditEventDto } from '../../audit/dto/record-audit-event.dto.js';
import type { IAuditLogger } from '../../audit/service/interface/audit-logger.interface.js';
import type { IMembershipRepository } from '../../membership/repository/interface/membership.repository.interface.js';
import type { IOrganization } from '../../organizations/model/organization.model.js';
import type { IRole } from '../../role/model/role.model.js';
import type { ISessionService } from '../../session/service/interface/session.service.interface.js';

import type { AdminListApiKeysDto } from '../dto/list-api-keys.dto.js';
import type { AdminListApplicationsDto } from '../dto/list-applications.dto.js';
import type { ListUsersDto } from '../dto/list-users.dto.js';
import type { UpdateSystemSettingsDto } from '../dto/update-system-settings.dto.js';
import type { UpdateUserDto } from '../dto/update-user.dto.js';
import {
  toAdminApiKeyResponse,
  toAdminApplicationResponse,
  toAdminUserDetailResponse,
  toAdminUserResponse,
  toSystemSettingsResponse,
} from '../mapper/admin-mapper.js';
import type { IAdminRepository } from '../repository/interface/admin.repository.interface.js';
import { AdminApiKeyListResponse } from '../responses/admin-api-key.response.js';
import { AdminApplicationListResponse } from '../responses/admin-application.response.js';
import { AdminSessionListResponse } from '../responses/admin-session-list.response.js';
import { AdminUserListResponse } from '../responses/admin-user.response.js';
import type {
  AdminApiKeyListResult,
  AdminApplicationListResult,
  AdminRevokeSessionResult,
  AdminSessionListResult,
  AdminUserDetailResult,
  AdminUserListResult,
  SystemSettingsResult,
} from '../types/admin.types.js';
import type { PlatformRole } from '../../../shared/security/authorization/platform-roles.js';
import type { IAdminService } from './interface/admin.service.interface.js';

export class AdminService implements IAdminService {
  constructor(
    private readonly repository: IAdminRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly sessionService: ISessionService,
    private readonly auditLogger?: IAuditLogger,
  ) {}

  async listUsers(dto: ListUsersDto): Promise<AdminUserListResult> {
    const found = await this.repository.listUsers(dto);
    if (!found.ok) return err(found.error);

    return ok(
      new AdminUserListResponse(
        found.value.users.map(toAdminUserResponse),
        found.value.total,
        dto.page,
        dto.limit,
      ),
    );
  }

  async getUserById(id: string): Promise<AdminUserDetailResult> {
    const found = await this.repository.getUserById(id);
    if (!found.ok) return err(found.error);
    if (!found.value) return err(new NotFoundError('User not found.'));

    const memberships = await this.membershipRepository.findByUser(id);
    if (!memberships.ok) return err(memberships.error);

    const organizations = memberships.value.map((membership) => {
      const organization = membership.organizationId as unknown as IOrganization;
      const roles = membership.roleIds as unknown as IRole[];
      return {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        roles: roles.map((role) => role.name),
      };
    });

    return ok(toAdminUserDetailResponse(found.value, organizations));
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    callerPlatformRole: PlatformRole,
    actorId?: string,
  ): Promise<AdminUserDetailResult> {
    const found = await this.repository.getUserById(id);
    if (!found.ok) return err(found.error);
    if (!found.value) return err(new NotFoundError('User not found.'));

    // "Only Platform Owner should perform these actions" (doc, 15.5) -
    // a platform role change is never something 'user:update' alone
    // (which Admin also holds) is enough to authorize.
    if (dto.platformRole !== undefined && callerPlatformRole !== 'owner') {
      return err(new ForbiddenError('Only a Platform Owner may change platform roles.'));
    }

    // "Cannot: Promote Platform Owner, Demote Platform Owner" (doc,
    // section 4) - read literally this only bars ROLE changes to/from
    // Owner, but a non-Owner being able to SUSPEND an Owner's account
    // would be just as serious a privilege-escalation/DoS path (a
    // compromised Admin locking out the actual Owner), so this
    // deliberately extends to every field on an Owner's account, not
    // just platformRole. If this reading turns out to be broader than
    // intended, it should be relaxed explicitly rather than left as an
    // accidental gap.
    if (found.value.platformRole === 'owner' && callerPlatformRole !== 'owner') {
      return err(new ForbiddenError('Only a Platform Owner may modify another Owner’s account.'));
    }

    const updated = await this.repository.updateUser(id, dto);
    if (!updated.ok) return err(updated.error);
    if (!updated.value) return err(new NotFoundError('User not found.'));

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'admin.user_updated',
        true,
        actorId,
        'user',
        'user',
        id,
        undefined,
        undefined,
        { platformRole: dto.platformRole, status: dto.status },
      ),
    );

    return this.getUserById(id);
  }

  async listApplications(dto: AdminListApplicationsDto): Promise<AdminApplicationListResult> {
    const found = await this.repository.listApplications(dto);
    if (!found.ok) return err(found.error);

    return ok(
      new AdminApplicationListResponse(
        found.value.applications.map(toAdminApplicationResponse),
        found.value.total,
        dto.page,
        dto.limit,
      ),
    );
  }

  async listApiKeys(dto: AdminListApiKeysDto): Promise<AdminApiKeyListResult> {
    const found = await this.repository.listApiKeys(dto);
    if (!found.ok) return err(found.error);

    return ok(
      new AdminApiKeyListResponse(
        found.value.apiKeys.map(toAdminApiKeyResponse),
        found.value.total,
        dto.page,
        dto.limit,
      ),
    );
  }

  async listSessionsForUser(userId: string): Promise<AdminSessionListResult> {
    const found = await this.repository.getUserById(userId);
    if (!found.ok) return err(found.error);
    if (!found.value) return err(new NotFoundError('User not found.'));

    const sessions = await this.sessionService.listByUser(userId);
    if (!sessions.ok) return err(sessions.error);

    return ok(new AdminSessionListResponse(userId, sessions.value));
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    actorId?: string,
  ): Promise<AdminRevokeSessionResult> {
    const revoked = await this.sessionService.revokeSession(userId, sessionId);
    if (!revoked.ok) return err(revoked.error);

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'admin.session_revoked',
        true,
        actorId,
        'user',
        'user',
        userId,
        undefined,
        undefined,
        { sessionId },
      ),
    );

    return ok({ message: 'Session revoked successfully.' });
  }

  async getSystemSettings(): Promise<SystemSettingsResult> {
    const found = await this.repository.getSystemSettings();
    if (!found.ok) return err(found.error);

    return ok(toSystemSettingsResponse(found.value));
  }

  async updateSystemSettings(
    dto: UpdateSystemSettingsDto,
    actorId: string,
  ): Promise<SystemSettingsResult> {
    const updated = await this.repository.updateSystemSettings(dto, actorId);
    if (!updated.ok) return err(updated.error);

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'admin.system_settings_updated',
        true,
        actorId,
        'user',
        'system_settings',
        'singleton',
      ),
    );

    return ok(toSystemSettingsResponse(updated.value));
  }
}
