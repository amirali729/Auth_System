import type { NextFunction, Request, Response } from 'express';
import { AdminListApiKeysDto } from '../dto/list-api-keys.dto.js';
import { AdminListApplicationsDto } from '../dto/list-applications.dto.js';
import { ListUsersDto } from '../dto/list-users.dto.js';
import type { PlatformRole } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/security/authorization/platform-roles.js';
import { UpdateSystemSettingsDto } from '../dto/update-system-settings.dto.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import type { IAdminService } from '../service/interface/admin.service.interface.js';
import type {
  AdminApiKeyListResult,
  AdminApplicationListResult,
  AdminRevokeSessionResult,
  AdminSessionListResult,
  AdminUserDetailResult,
  AdminUserListResult,
  SystemSettingsResult,
} from '../types/admin.types.js';
import type { IAdminController } from './interface/admin.controller.interface.js';

export class AdminController implements IAdminController {
  constructor(private readonly service: IAdminService) {}

  async listUsers(req: Request, _res: Response, _next: NextFunction): Promise<AdminUserListResult> {
    const dto = new ListUsersDto(
      req.query.page ? Number(req.query.page) : 1,
      req.query.limit ? Number(req.query.limit) : 20,
      req.query.search as string | undefined,
      req.query.platformRole as PlatformRole | undefined,
      req.query.status as 'active' | 'deactivated' | undefined,
    );

    return this.service.listUsers(dto);
  }

  async getUserById(
    req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<AdminUserDetailResult> {
    return this.service.getUserById(req.params.id as string);
  }

  async updateUser(
    req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<AdminUserDetailResult> {
    const dto = new UpdateUserDto(req.body.platformRole, req.body.status);

    return this.service.updateUser(
      req.params.id as string,
      dto,
      req.user.platformRole,
      req.user?._id?.toString(),
    );
  }

  async listApplications(
    req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<AdminApplicationListResult> {
    const dto = new AdminListApplicationsDto(
      req.query.page ? Number(req.query.page) : 1,
      req.query.limit ? Number(req.query.limit) : 20,
      req.query.tenantId as string | undefined,
    );

    return this.service.listApplications(dto);
  }

  async listApiKeys(
    req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<AdminApiKeyListResult> {
    const dto = new AdminListApiKeysDto(
      req.query.page ? Number(req.query.page) : 1,
      req.query.limit ? Number(req.query.limit) : 20,
      req.query.applicationId as string | undefined,
      req.query.status as 'active' | 'revoked' | undefined,
    );

    return this.service.listApiKeys(dto);
  }

  async listSessionsForUser(
    req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<AdminSessionListResult> {
    return this.service.listSessionsForUser(req.params.userId as string);
  }

  async revokeSession(
    req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<AdminRevokeSessionResult> {
    return this.service.revokeSession(
      req.params.userId as string,
      req.params.sessionId as string,
      req.user?._id?.toString(),
    );
  }

  async getSystemSettings(
    _req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<SystemSettingsResult> {
    return this.service.getSystemSettings();
  }

  async updateSystemSettings(
    req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<SystemSettingsResult> {
    const dto = new UpdateSystemSettingsDto(
      req.body.allowSignups,
      req.body.maintenanceMode,
      req.body.maintenanceMessage,
      req.body.defaultOrganizationPlan,
      req.body.supportEmail,
    );

    return this.service.updateSystemSettings(dto, req.user._id.toString());
  }
}
