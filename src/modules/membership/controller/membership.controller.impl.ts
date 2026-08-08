import type { NextFunction, Request, Response } from 'express';
import type { IMembershipService } from '../service/interface/membership.service.interface.js';
import type {
  MemberListResult,
  MemberResult,
  RemoveMemberResult,
} from '../types/membership.types.js';
import type { IMembershipController } from './interface/membership.controller.interface.js';

export class MembershipController implements IMembershipController {
  constructor(private readonly service: IMembershipService) {}

  async list(req: Request, _res: Response, _next: NextFunction): Promise<MemberListResult> {
    return this.service.list(req.params.orgId as string, req.tenantId, req.user._id.toString());
  }

  async suspend(req: Request, _res: Response, _next: NextFunction): Promise<MemberResult> {
    return this.service.suspend(
      req.params.orgId as string,
      req.params.userId as string,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async reactivate(req: Request, _res: Response, _next: NextFunction): Promise<MemberResult> {
    return this.service.reactivate(
      req.params.orgId as string,
      req.params.userId as string,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async remove(req: Request, _res: Response, _next: NextFunction): Promise<RemoveMemberResult> {
    return this.service.remove(
      req.params.orgId as string,
      req.params.userId as string,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }
}
