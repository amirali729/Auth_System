import type { NextFunction, Request, Response } from 'express';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto.js';
import { InviteMemberDto } from '../dto/invite-member.dto.js';
import type { IInvitationService } from '../service/interface/invitation.service.interface.js';
import type {
  AcceptInvitationResult,
  InvitationListResult,
  InvitationResult,
  RevokeInvitationResult,
} from '../types/invitation.types.js';
import type { IInvitationController } from './interface/invitation.controller.interface.js';

export class InvitationController implements IInvitationController {
  constructor(private readonly service: IInvitationService) {}

  async invite(req: Request, _res: Response, _next: NextFunction): Promise<InvitationResult> {
    const dto = new InviteMemberDto(req.body.email);

    return this.service.invite(
      req.params.orgId as string,
      dto,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async list(req: Request, _res: Response, _next: NextFunction): Promise<InvitationListResult> {
    return this.service.list(req.params.orgId as string, req.tenantId, req.user._id.toString());
  }

  async revoke(req: Request, _res: Response, _next: NextFunction): Promise<RevokeInvitationResult> {
    return this.service.revoke(
      req.params.orgId as string,
      req.params.invitationId as string,
      req.tenantId,
      req.user._id.toString(),
      req.user?._id?.toString(),
    );
  }

  async accept(req: Request, _res: Response, _next: NextFunction): Promise<AcceptInvitationResult> {
    const dto = new AcceptInvitationDto(req.body.token, req.body.username, req.body.password);

    return this.service.accept(dto);
  }
}
