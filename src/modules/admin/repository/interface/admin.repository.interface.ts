import type { InfrastructureError } from '../../../../shared/errors/infrastructure.error.js';
import type { Result } from '../../../../shared/result/result.js';
import type { IUser } from '../../../auth/model/user.model.js';
import type { IApiKey } from '../../../apikey/model/api-key.model.js';
import type { IApplication } from '../../../application/model/application.model.js';
import type { AdminListApiKeysDto } from '../../dto/list-api-keys.dto.js';
import type { AdminListApplicationsDto } from '../../dto/list-applications.dto.js';
import type { ListUsersDto } from '../../dto/list-users.dto.js';
import type { UpdateSystemSettingsDto } from '../../dto/update-system-settings.dto.js';
import type { UpdateUserDto } from '../../dto/update-user.dto.js';
import type { ISystemSettings } from '../../model/system-settings.model.js';

export type DataResult<T> = Result<T, InfrastructureError>;

export interface IAdminRepository {
  listUsers(dto: ListUsersDto): Promise<DataResult<{ users: IUser[]; total: number }>>;

  getUserById(id: string): Promise<DataResult<IUser | null>>;

  updateUser(id: string, dto: UpdateUserDto): Promise<DataResult<IUser | null>>;

  listApplications(
    dto: AdminListApplicationsDto,
  ): Promise<DataResult<{ applications: IApplication[]; total: number }>>;

  listApiKeys(dto: AdminListApiKeysDto): Promise<DataResult<{ apiKeys: IApiKey[]; total: number }>>;

  getSystemSettings(): Promise<DataResult<ISystemSettings>>;

  updateSystemSettings(
    dto: UpdateSystemSettingsDto,
    updatedBy: string,
  ): Promise<DataResult<ISystemSettings>>;
}
