import type { NextFunction, Request, Response } from 'express';

import { Membership } from '../../../modules/membership/model/membership.model.js';
import { isPlatformOperator } from '../authorization/organization-access.js';

/**
 * Self-hosted deployments typically run a single tenant and don't need
 * resolution at all (see docs/Multi-Tenant & SaaS Architecture.md,
 * section 15). Set MULTI_TENANT=true in .env to enable it for Hosted
 * SaaS-style deployments.
 */
function isMultiTenantEnabled(): boolean {
  return process.env.MULTI_TENANT === 'true';
}

/**
 * Resolves req.tenantId from an explicit X-Tenant-ID header.
 *
 * On an AUTHENTICATED request (req.user already set by verifyjwt), the
 * header is not trusted at face value - the caller must either hold a
 * global (platform-level) role, or have an active Membership in that
 * specific organization. Without this check, any authenticated user
 * holding a permission key via a role scoped to ANY org they legitimately
 * belong to could set X-Tenant-ID to a DIFFERENT org's ID and pass every
 * permission check for it, since permission keys alone don't say which
 * org granted them - only membership does. See permission-evaluator.ts
 * for the matching org-scoped permission fix.
 *
 * On an UNAUTHENTICATED request (signup/login), there's no membership to
 * verify yet - the header there just selects which org's user pool to
 * sign up into or log in against, which is the entire point of sending
 * it on those specific routes.
 *
 * Does not require a tenant to be present at all - individual routes
 * decide whether one is required (see requireTenant below).
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  if (!isMultiTenantEnabled()) {
    return next();
  }

  const headerTenantId = req.headers['x-tenant-id'];

  if (typeof headerTenantId !== 'string' || !headerTenantId) {
    return next();
  }

  if (!req.user) {
    req.tenantId = headerTenantId;
    return next();
  }

  const isPlatformLevelUser = await isPlatformOperator(req.user._id.toString());

  if (isPlatformLevelUser) {
    req.tenantId = headerTenantId;
    return next();
  }

  const membership = await Membership.findOne({
    organizationId: headerTenantId,
    userId: req.user._id,
    status: 'active',
  });

  if (!membership) {
    // Deliberately NOT falling through with req.tenantId left unset:
    // several ownership checks elsewhere (see application/membership/
    // invitation services' belongsToCaller helpers) treat an undefined
    // caller tenant as "single-tenant mode, no restriction applies" -
    // silently continuing here would let a rejected claim fall back
    // into that same trivially-permissive path. Reject outright instead.
    return res.status(403).json({
      message: 'You are not an active member of this organization.',
    });
  }

  req.tenantId = headerTenantId;
  next();
}

/**
 * Use on routes that must not proceed without a resolved tenant (e.g.
 * platform-admin-only actions in a hosted deployment). No-ops when
 * MULTI_TENANT is disabled.
 */
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (!isMultiTenantEnabled()) {
    return next();
  }

  if (!req.tenantId) {
    return res.status(400).json({
      message: 'A tenant could not be resolved for this request (missing X-Tenant-ID header).',
    });
  }

  next();
}
