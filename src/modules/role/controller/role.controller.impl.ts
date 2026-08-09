import type { NextFunction, Request, Response } from 'express';
import { AssignRoleDto } from '../dto/assign-role.dto.js';
import { CreateRoleDto } from '../dto/create-role.dto.js';
import { SetRolePermissionsDto } from '../dto/set-role-permission.dto.js';
import { UpdateRoleDto } from '../dto/update-role.dto.js';
import type { IRoleService } from '../service/interface/role.service.interface.js';
import type {
  AssignRoleResult,
  DeleteRoleResult,
  RoleListResult,
  RoleResult,
} from '../types/role.types.js';
import type { IRoleController } from './interface/role.controller.interface.js';

export class RoleController implements IRoleController {
  constructor(private readonly service: IRoleService) {}

  async list(req: Request, _res: Response, _next: NextFunction): Promise<RoleListResult> {
    return this.service.list(req.tenantId);
  }

  async getById(req: Request, _res: Response, _next: NextFunction): Promise<RoleResult> {
    return this.service.getById(req.params.id as string, req.tenantId, req.user._id.toString());
  }

  async create(req: Request, _res: Response, _next: NextFunction): Promise<RoleResult> {
    const dto = new CreateRoleDto(
      req.body.name,
      req.body.description,
      req.body.permissionIds ?? [],
    );

    return this.service.create(dto, req.tenantId, req.user?._id?.toString());
  }

  async updateMeta(req: Request, _res: Response, _next: NextFunction): Promise<RoleResult> {
    const dto = new UpdateRoleDto(req.body.name, req.body.description);

    return this.service.updateMeta(
      req.params.id as string,
      dto,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async setPermissions(req: Request, _res: Response, _next: NextFunction): Promise<RoleResult> {
    const dto = new SetRolePermissionsDto(req.body.permissionIds ?? []);

    return this.service.setPermissions(
      req.params.id as string,
      dto,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async delete(req: Request, _res: Response, _next: NextFunction): Promise<DeleteRoleResult> {
    return this.service.delete(
      req.params.id as string,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async assignToUser(req: Request, _res: Response, _next: NextFunction): Promise<AssignRoleResult> {
    const dto = new AssignRoleDto(
      req.params.orgId as string,
      req.params.userId as string,
      req.body.roleId,
    );

    return this.service.assignToUser(
      dto,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async removeFromUser(
    req: Request,
    _res: Response,
    _next: NextFunction,
  ): Promise<AssignRoleResult> {
    const dto = new AssignRoleDto(
      req.params.orgId as string,
      req.params.userId as string,
      req.params.roleId as string,
    );

    return this.service.removeFromUser(
      dto,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }
}
