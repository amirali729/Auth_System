import type { AssignRoleDto } from '../../dto/assign-role.dto.js';
import type { CreateRoleDto } from '../../dto/create-role.dto.js';
import type { SetRolePermissionsDto } from '../../dto/set-role-permission.dto.js';
import type { UpdateRoleDto } from '../../dto/update-role.dto.js';
import type {
  AssignRoleResult,
  DeleteRoleResult,
  RoleListResult,
  RoleResult,
} from '../../types/role.types.js';

export interface IRoleService {
  list(tenantId: string | undefined): Promise<RoleListResult>;

  getById(id: string, callerTenantId: string | undefined, callerId: string): Promise<RoleResult>;

  create(dto: CreateRoleDto, tenantId: string | undefined, actorId?: string): Promise<RoleResult>;

  updateMeta(
    id: string,
    dto: UpdateRoleDto,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<RoleResult>;

  setPermissions(
    id: string,
    dto: SetRolePermissionsDto,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<RoleResult>;

  delete(
    id: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<DeleteRoleResult>;

  assignToUser(
    dto: AssignRoleDto,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<AssignRoleResult>;

  removeFromUser(
    dto: AssignRoleDto,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<AssignRoleResult>;
}
