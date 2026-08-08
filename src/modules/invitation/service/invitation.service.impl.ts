import crypto from 'crypto';

import { callerBelongsToOrganization } from '../../../shared/security/authorization/organization-access.js';
import { ValidationError } from '../../../shared/errors/validation.error.js';
import { err, ok } from '../../../shared/result/result.js';
import { hashToken } from '../../../shared/security/hashing/token-hash.js';

import type { IMailer } from '../../email/mailer.interface.js';
import { buildInvitationEmail } from '../../email/templates/invitation.emails.js';

import { OrganizationNotFoundError } from '../../organizations/errors/organization-not-found.error.js';
import type { IOrganizationRepository } from '../../organizations/repository/interface/organization.repository.interface.js';

import { AlreadyMemberError } from '../../membership/errors/already-member.error.js';
import type { IMembershipRepository } from '../../membership/repository/interface/membership.repository.interface.js';

import { SignUpDto } from '../../auth/dto/signup.dto.js';
import { EmailAlreadyExistsError } from '../../auth/errors/email-already-exists.error.js';
import { UsernameAlreadyExistsError } from '../../auth/errors/username-already-exists.error.js';
import type { IAuthRepository } from '../../auth/repository/interface/auth.repository.interface.js';

import type { AcceptInvitationDto } from '../dto/accept-invitation.dto.js';
import type { InviteMemberDto } from '../dto/invite-member.dto.js';
import { InvitationExpiredError } from '../errors/invitation-expired.error.js';
import { InvitationNotFoundError } from '../errors/invitation-not-found.error.js';
import type { IInvitationRepository } from '../repository/interface/invitation.repository.interface.js';
import { AcceptInvitationResponse } from '../responses/accept-invitation.response.js';
import type {
  AcceptInvitationResult,
  InvitationListResult,
  InvitationResult,
  RevokeInvitationResult,
} from '../types/invitation.types.js';
import type { IInvitationService } from './interface/invitation.service.interface.js';
import { toInvitationResponse } from './invitation-mapper.js';

import { RecordAuditEventDto } from '../../audit/dto/record-audit-event.dto.js';
import type { IAuditLogger } from '../../audit/service/interface/audit-logger.interface.js';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class InvitationService implements IInvitationService {
  constructor(
    private readonly invitationRepository: IInvitationRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly authRepository: IAuthRepository,
    private readonly mailer: IMailer,
    private readonly clientUrl: string,
    private readonly auditLogger?: IAuditLogger,
  ) {}

  private async belongsToCaller(
    organizationId: string,
    callerTenantId: string | undefined,
    callerId: string,
  ): Promise<boolean> {
    return callerBelongsToOrganization(organizationId, callerTenantId, callerId);
  }

  async invite(
    organizationId: string,
    dto: InviteMemberDto,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<InvitationResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const org = await this.organizationRepository.findById(organizationId);
    if (!org.ok) return err(org.error);
    if (!org.value) return err(new OrganizationNotFoundError());

    const email = dto.email.toLowerCase().trim();

    // Already an active member? Don't send a redundant invite.
    const existingUser = await this.authRepository.findByEmail(email);
    if (!existingUser.ok) return err(existingUser.error);
    if (existingUser.value) {
      const existingMembership = await this.membershipRepository.findOne(
        organizationId,
        existingUser.value._id.toString(),
      );
      if (!existingMembership.ok) return err(existingMembership.error);
      if (existingMembership.value) {
        return err(new AlreadyMemberError());
      }
    }

    // A fresh invite replaces any still-pending one for the same email
    // (effectively "resend" - new token, new expiry).
    const existingInvite = await this.invitationRepository.findPendingByEmail(
      organizationId,
      email,
    );
    if (!existingInvite.ok) return err(existingInvite.error);
    if (existingInvite.value) {
      await this.invitationRepository.delete(existingInvite.value._id.toString());
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    const created = await this.invitationRepository.create({
      organizationId,
      email,
      tokenHash,
      invitedBy: actorId,
      expiresAt,
    });
    if (!created.ok) return err(created.error);

    const acceptUrl = `${this.clientUrl}/accept-invite?token=${rawToken}`;
    await this.mailer.send(buildInvitationEmail(email, org.value.name, acceptUrl));

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'invitation.created',
        true,
        actorId,
        'user',
        'invitation',
        created.value._id.toString(),
        undefined,
        undefined,
        { email },
        organizationId,
      ),
    );

    return ok(toInvitationResponse(created.value));
  }

  async list(
    organizationId: string,
    callerTenantId: string | undefined,
    callerId: string,
  ): Promise<InvitationListResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const org = await this.organizationRepository.findById(organizationId);
    if (!org.ok) return err(org.error);
    if (!org.value) return err(new OrganizationNotFoundError());

    const found = await this.invitationRepository.findByOrganization(organizationId);
    if (!found.ok) return err(found.error);

    // Lazily flip stale pending invites to "expired" as they're read,
    // rather than needing a background job to sweep them.
    const now = Date.now();
    const results = await Promise.all(
      found.value.map(async (invitation) => {
        if (invitation.status === 'pending' && invitation.expiresAt.getTime() < now) {
          const updated = await this.invitationRepository.updateStatus(
            invitation._id.toString(),
            'expired',
          );
          return updated.ok && updated.value ? updated.value : invitation;
        }
        return invitation;
      }),
    );

    return ok(results.map(toInvitationResponse));
  }

  async revoke(
    organizationId: string,
    invitationId: string,
    callerTenantId: string | undefined,
    callerId: string,
    actorId?: string,
  ): Promise<RevokeInvitationResult> {
    if (!(await this.belongsToCaller(organizationId, callerTenantId, callerId))) {
      return err(new OrganizationNotFoundError());
    }

    const found = await this.invitationRepository.findById(invitationId);
    if (!found.ok) return err(found.error);
    if (!found.value || found.value.organizationId.toString() !== organizationId) {
      return err(new InvitationNotFoundError());
    }
    if (found.value.status !== 'pending') {
      return err(new InvitationNotFoundError());
    }

    const updated = await this.invitationRepository.updateStatus(invitationId, 'revoked');
    if (!updated.ok) return err(updated.error);

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'invitation.revoked',
        true,
        actorId,
        'user',
        'invitation',
        invitationId,
        undefined,
        undefined,
        undefined,
        organizationId,
      ),
    );

    return ok({ message: 'Invitation revoked successfully.' });
  }

  async accept(dto: AcceptInvitationDto): Promise<AcceptInvitationResult> {
    const tokenHash = hashToken(dto.token);

    const found = await this.invitationRepository.findByTokenHash(tokenHash);
    if (!found.ok) return err(found.error);
    if (!found.value) return err(new InvitationNotFoundError());

    const invitation = found.value;

    if (invitation.status === 'expired') {
      return err(new InvitationExpiredError());
    }
    if (invitation.status !== 'pending') {
      return err(new InvitationNotFoundError());
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      await this.invitationRepository.updateStatus(invitation._id.toString(), 'expired');
      return err(new InvitationExpiredError());
    }

    const organizationId = invitation.organizationId.toString();

    const existingUser = await this.authRepository.findByEmail(invitation.email);
    if (!existingUser.ok) return err(existingUser.error);

    let userId: string;

    if (existingUser.value) {
      userId = existingUser.value._id.toString();
    } else {
      if (!dto.username || !dto.password) {
        return err(
          new ValidationError(
            'No account exists for this email yet - provide a username and password to create one.',
          ),
        );
      }

      const usernameTaken = await this.authRepository.findByEmailOrUsername(
        invitation.email,
        dto.username,
        organizationId,
      );
      if (!usernameTaken.ok) return err(usernameTaken.error);
      if (usernameTaken.value) {
        if (usernameTaken.value.email === invitation.email) {
          return err(new EmailAlreadyExistsError());
        }
        return err(new UsernameAlreadyExistsError());
      }

      const created = await this.authRepository.createUser(
        new SignUpDto(dto.username, invitation.email, dto.password),
        organizationId,
      );
      if (!created.ok) return err(created.error);

      // Accepting the invite proves control of the inbox that received
      // it, same trust level as clicking an email-verification link -
      // so skip the redundant separate verification step.
      created.value.isVerified = true;
      await this.authRepository.save(created.value, { validateBeforeSave: false });

      userId = created.value._id.toString();
    }

    const existingMembership = await this.membershipRepository.findOne(organizationId, userId);
    if (!existingMembership.ok) return err(existingMembership.error);
    if (existingMembership.value) {
      return err(new AlreadyMemberError());
    }

    const membership = await this.membershipRepository.create(organizationId, userId, 'active');
    if (!membership.ok) return err(membership.error);

    await this.invitationRepository.updateStatus(invitation._id.toString(), 'accepted');

    void this.auditLogger?.record(
      new RecordAuditEventDto(
        'invitation.accepted',
        true,
        userId,
        'user',
        'organization',
        organizationId,
        undefined,
        undefined,
        { invitationId: invitation._id.toString() },
        organizationId,
      ),
    );

    return ok(new AcceptInvitationResponse(organizationId, userId));
  }
}
