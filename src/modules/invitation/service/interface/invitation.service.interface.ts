import type { AcceptInvitationDto } from '../../dto/accept-invitation.dto.js';
import type { InviteMemberDto } from '../../dto/invite-member.dto.js';
import type {
  AcceptInvitationResult,
  InvitationListResult,
  InvitationResult,
  RevokeInvitationResult,
} from '../../types/invitation.types.js';

export interface IInvitationService {
  invite(
    organizationId: string,
    dto: InviteMemberDto,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<InvitationResult>;

  list(
    organizationId: string,
    callerTenantId: string | undefined,
    callerId: string,
  ): Promise<InvitationListResult>;

  revoke(
    organizationId: string,
    invitationId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<RevokeInvitationResult>;

  accept(dto: AcceptInvitationDto): Promise<AcceptInvitationResult>;
}
