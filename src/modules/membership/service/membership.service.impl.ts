import { callerBelongsToOrganization } from '../../../shared/security/authorization/organization-access.js';
import { err, ok } from '../../../shared/result/result.js';
import { OrganizationNotFoundError } from '../../organizations/errors/organization-not-found.error.js';
import type { IOrganizationRepository } from '../../organizations/repository/interface/organization.repository.interface.js';
import { MemberNotFoundError } from '../errors/member-not-found.error.js';
import type { IMembershipRepository } from '../repository/interface/membership.repository.interface.js';
import type {
  MemberListResult,
  MemberResult,
  RemoveMemberResult,
} from '../types/membership.types.js';
import type { IMembershipService } from './interface/membership.service.interface.js';
import { toMemberResponse } from './membership-mapper.js';

import { RecordAuditEventDto } from '../../audit/dto/record-audit-event.dto.js';
import type { IAuditLogger } from '../../audit/service/interface/audit-logger.interface.js';

export class MembershipService implements IMembershipService {
  constructor(
    private readonly membershipRepository: IMembershipRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly auditLogger?: IAuditLogger,
  ) {}

  async list(
    organizationId: string,
    callerTenantId: string | undefined,
    callerId: string,
  ): Promise<MemberListResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const org = await this.organizationRepository.findById(organizationId);
    if (!org.ok) return err(org.error);
    if (!org.value) return err(new OrganizationNotFoundError());

    const found = await this.membershipRepository.findByOrganization(organizationId);
    if (!found.ok) return err(found.error);

    return ok(found.value.map(toMemberResponse));
  }

  async suspend(
    organizationId: string,
    userId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<MemberResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const updated = await this.membershipRepository.updateStatus(
      organizationId,
      userId,
      'suspended',
    );
    if (!updated.ok) return err(updated.error);
    if (!updated.value) return err(new MemberNotFoundError());

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'member.suspended',
        true,
        actorId,
        'user',
        'user',
        userId,
        undefined,
        undefined,
        { organizationId },
        organizationId,
      ),
    );

    return ok(toMemberResponse(updated.value));
  }

  async reactivate(
    organizationId: string,
    userId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<MemberResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const updated = await this.membershipRepository.updateStatus(organizationId, userId, 'active');
    if (!updated.ok) return err(updated.error);
    if (!updated.value) return err(new MemberNotFoundError());

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'member.reactivated',
        true,
        actorId,
        'user',
        'user',
        userId,
        undefined,
        undefined,
        { organizationId },
        organizationId,
      ),
    );

    return ok(toMemberResponse(updated.value));
  }

  async remove(
    organizationId: string,
    userId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<RemoveMemberResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const deleted = await this.membershipRepository.delete(organizationId, userId);
    if (!deleted.ok) return err(deleted.error);
    if (!deleted.value) return err(new MemberNotFoundError());

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'member.removed',
        true,
        actorId,
        'user',
        'user',
        userId,
        undefined,
        undefined,
        { organizationId },
        organizationId,
      ),
    );

    return ok({ message: 'Member removed from organization successfully.' });
  }

  /**
   * True if a caller resolved to `callerTenantId` may act on
   * organization `organizationId`. Mirrors the same fetch-then-compare
   * pattern used for Application ownership (see
   * application.service.impl.ts) - undefined callerTenantId
   * (single-tenant deployments, MULTI_TENANT=false) always passes.
   */
  private async belongsToCaller(
    organizationId: string,
    callerTenantId: string | undefined,
    callerId: string,
  ): Promise<boolean> {
    // No allowPlatformOperator: the doc doesn't grant platform roles
    // direct membership-management access to another org.
    return callerBelongsToOrganization(organizationId, callerTenantId, callerId);
  }
}
