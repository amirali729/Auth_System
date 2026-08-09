import type { NextFunction, Request, Response } from 'express';
import type {
  AdminApiKeyListResult,
  AdminApplicationListResult,
  AdminRevokeSessionResult,
  AdminSessionListResult,
  AdminUserDetailResult,
  AdminUserListResult,
  SystemSettingsResult,
} from '../../types/admin.types.js';

export interface IAdminController {
  listUsers(req: Request, res: Response, next: NextFunction): Promise<AdminUserListResult>;

  getUserById(req: Request, res: Response, next: NextFunction): Promise<AdminUserDetailResult>;

  updateUser(req: Request, res: Response, next: NextFunction): Promise<AdminUserDetailResult>;

  listApplications(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<AdminApplicationListResult>;

  listApiKeys(req: Request, res: Response, next: NextFunction): Promise<AdminApiKeyListResult>;

  listSessionsForUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<AdminSessionListResult>;

  revokeSession(req: Request, res: Response, next: NextFunction): Promise<AdminRevokeSessionResult>;

  getSystemSettings(req: Request, res: Response, next: NextFunction): Promise<SystemSettingsResult>;

  updateSystemSettings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<SystemSettingsResult>;
}
