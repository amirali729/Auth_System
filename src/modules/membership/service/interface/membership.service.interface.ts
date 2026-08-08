import type {
  MemberListResult,
  MemberResult,
  RemoveMemberResult,
} from '../../types/membership.types.js';

export interface IMembershipService {
  list(
    organizationId: string,
    callerTenantId: string | undefined,
    callerId: string,
  ): Promise<MemberListResult>;

  suspend(
    organizationId: string,
    userId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<MemberResult>;

  reactivate(
    organizationId: string,
    userId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<MemberResult>;

  remove(
    organizationId: string,
    userId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<RemoveMemberResult>;
}
