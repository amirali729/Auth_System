import { User } from '../../auth/model/user.model.js';
import type { IUser } from '../../auth/model/user.model.js';
import { ApiKey } from '../../apikey/model/api-key.model.js';
import type { IApiKey } from '../../apikey/model/api-key.model.js';
import { Application } from '../../application/model/application.model.js';
import type { IApplication } from '../../application/model/application.model.js';

import { InfrastructureError } from '../../../shared/errors/infrastructure.error.js';
import { err, ok } from '../../../shared/result/result.js';

import type { AdminListApiKeysDto } from '../dto/list-api-keys.dto.js';
import type { AdminListApplicationsDto } from '../dto/list-applications.dto.js';
import type { ListUsersDto } from '../dto/list-users.dto.js';
import type { UpdateSystemSettingsDto } from '../dto/update-system-settings.dto.js';
import type { UpdateUserDto } from '../dto/update-user.dto.js';
import { SYSTEM_SETTINGS_SINGLETON_ID, SystemSettings } from '../model/system-settings.model.js';
import type { ISystemSettings } from '../model/system-settings.model.js';
import type { DataResult, IAdminRepository } from './interface/admin.repository.interface.js';

/**
 * Every list/read here queries models directly rather than going
 * through Application/ApiKey/User's own CRUD repositories - those
 * interfaces model "one tenant's records" or "one user's own account",
 * not "every record platform-wide with pagination/search", and
 * bending them to do both would leak an admin-reporting concern into
 * every other module's contract (same reasoning as
 * metrics/repository/metrics.repository.impl.ts).
 */
export class AdminRepository implements IAdminRepository {
  async listUsers(dto: ListUsersDto): Promise<DataResult<{ users: IUser[]; total: number }>> {
    try {
      const filter: Record<string, unknown> = {};

      if (dto.search) {
        const pattern = new RegExp(dto.search.trim(), 'i');
        filter.$or = [{ username: pattern }, { email: pattern }, { fullName: pattern }];
      }
      if (dto.platformRole) {
        filter.platformRole = dto.platformRole;
      }
      if (dto.status) {
        filter.status = dto.status;
      }

      const skip = (dto.page - 1) * dto.limit;

      const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(dto.limit),
        User.countDocuments(filter),
      ]);

      return ok({ users, total });
    } catch {
      return err(new InfrastructureError());
    }
  }

  async getUserById(id: string): Promise<DataResult<IUser | null>> {
    try {
      const user = await User.findById(id);
      return ok(user);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<DataResult<IUser | null>> {
    try {
      const update: Record<string, unknown> = {};
      if (dto.platformRole !== undefined) update.platformRole = dto.platformRole;
      if (dto.status !== undefined) {
        update.status = dto.status;
        update.deactivatedAt = dto.status === 'deactivated' ? new Date() : undefined;
      }

      const user = await User.findByIdAndUpdate(id, update, { new: true });
      return ok(user);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async listApplications(
    dto: AdminListApplicationsDto,
  ): Promise<DataResult<{ applications: IApplication[]; total: number }>> {
    try {
      const filter: Record<string, unknown> = {};
      if (dto.tenantId) filter.tenantId = dto.tenantId;

      const skip = (dto.page - 1) * dto.limit;

      const [applications, total] = await Promise.all([
        Application.find(filter).sort({ createdAt: -1 }).skip(skip).limit(dto.limit),
        Application.countDocuments(filter),
      ]);

      return ok({ applications, total });
    } catch {
      return err(new InfrastructureError());
    }
  }

  async listApiKeys(
    dto: AdminListApiKeysDto,
  ): Promise<DataResult<{ apiKeys: IApiKey[]; total: number }>> {
    try {
      const filter: Record<string, unknown> = {};
      if (dto.applicationId) filter.applicationId = dto.applicationId;
      if (dto.status) filter.status = dto.status;

      const skip = (dto.page - 1) * dto.limit;

      const [apiKeys, total] = await Promise.all([
        ApiKey.find(filter).sort({ createdAt: -1 }).skip(skip).limit(dto.limit),
        ApiKey.countDocuments(filter),
      ]);

      return ok({ apiKeys, total });
    } catch {
      return err(new InfrastructureError());
    }
  }

  async getSystemSettings(): Promise<DataResult<ISystemSettings>> {
    try {
      const settings = await SystemSettings.findOneAndUpdate(
        { _id: SYSTEM_SETTINGS_SINGLETON_ID },
        { $setOnInsert: { _id: SYSTEM_SETTINGS_SINGLETON_ID } },
        { new: true, upsert: true },
      );
      return ok(settings);
    } catch {
      return err(new InfrastructureError());
    }
  }

  async updateSystemSettings(
    dto: UpdateSystemSettingsDto,
    updatedBy: string,
  ): Promise<DataResult<ISystemSettings>> {
    try {
      const update: Record<string, unknown> = { updatedBy };
      if (dto.allowSignups !== undefined) update.allowSignups = dto.allowSignups;
      if (dto.maintenanceMode !== undefined) update.maintenanceMode = dto.maintenanceMode;
      if (dto.maintenanceMessage !== undefined) update.maintenanceMessage = dto.maintenanceMessage;
      if (dto.defaultOrganizationPlan !== undefined) {
        update.defaultOrganizationPlan = dto.defaultOrganizationPlan;
      }
      if (dto.supportEmail !== undefined) update.supportEmail = dto.supportEmail;

      const settings = await SystemSettings.findOneAndUpdate(
        { _id: SYSTEM_SETTINGS_SINGLETON_ID },
        { $setOnInsert: { _id: SYSTEM_SETTINGS_SINGLETON_ID }, $set: update },
        { new: true, upsert: true },
      );
      return ok(settings);
    } catch {
      return err(new InfrastructureError());
    }
  }
}
