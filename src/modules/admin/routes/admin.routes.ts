import { Router } from 'express';

import { auditService } from '../../audit/routes/audit.routes.js';
import { MembershipRepository } from '../../membership/repository/membership.repository.impl.js';
import { SessionRepository } from '../../session/index.js';
import { SessionService } from '../../session/index.js';
import { AdminController } from '../controller/admin.controller.impl.js';
import { mapAdminError } from '../http/map-admin-error.js';
import { AdminRepository } from '../repository/admin.repository.impl.js';
import { AdminService } from '../service/admin.service.impl.js';

import { handle } from '../../../shared/http/handle.js';
import { validate } from '../../../shared/http/validate.js';
import { requirePermission } from '../../../shared/security/middleware/requirePermission.middleware.js';
import { verifyjwt } from '../../../shared/security/middleware/verifyJwt.middleware.js';
import { objectIdParamSchema } from '../../../shared/validation/object-id.schema.js';
import {
  listApiKeysQuerySchema,
  listApplicationsQuerySchema,
  listUsersQuerySchema,
  updateSystemSettingsSchema,
  updateUserSchema,
} from '../validation/admin.schemas.js';

import {
  ADMIN_API_KEYS_LIST,
  ADMIN_APPLICATIONS_LIST,
  ADMIN_SESSIONS_LIST_FOR_USER,
  ADMIN_SESSIONS_REVOKE,
  ADMIN_SYSTEM_SETTINGS,
  ADMIN_USERS_GET_BY_ID,
  ADMIN_USERS_LIST,
  ADMIN_USERS_UPDATE,
} from '../../../shared/api-endpoint/admin.api.endpoint.js';

const router = Router();

const adminRepository = new AdminRepository();
const membershipRepository = new MembershipRepository();
const sessionRepository = new SessionRepository();
const sessionService = new SessionService(sessionRepository);

const adminService = new AdminService(
  adminRepository,
  membershipRepository,
  sessionService,
  auditService,
);
const adminController = new AdminController(adminService);

// Every route here is a Platform Admin/Owner (and, for the read-only
// ones, Support) action per the Roles & Permissions doc's section 13-
// 15 - this module exists specifically to add the cross-tenant
// capabilities the doc identifies as MISSING (section 15), not to
// duplicate Organizations/Audit Logs/Metrics/Health, which the doc
// explicitly says to reuse as-is (section 14) by simply removing the
// tenant restriction for a platform operator - already true of those
// modules' existing routes, nothing to add here.
router.use(verifyjwt);

router.get(
  ADMIN_USERS_LIST,
  requirePermission('user:view'),
  validate({ query: listUsersQuerySchema }),
  handle(adminController.listUsers.bind(adminController), mapAdminError),
);

router.get(
  ADMIN_USERS_GET_BY_ID,
  requirePermission('user:view'),
  validate({ params: objectIdParamSchema('id') }),
  handle(adminController.getUserById.bind(adminController), mapAdminError),
);

router.patch(
  ADMIN_USERS_UPDATE,
  // Gate is intentionally just 'user:update' (which Admin also holds) -
  // the STRICTER "only Owner may change platformRole / touch another
  // Owner's account" rule is enforced in AdminService.updateUser(),
  // not here, because a permission key can't express "only when this
  // specific field is in the body" or "only when the target is this
  // specific role."
  requirePermission('user:update'),
  validate({ params: objectIdParamSchema('id'), body: updateUserSchema }),
  handle(adminController.updateUser.bind(adminController), mapAdminError),
);

router.get(
  ADMIN_APPLICATIONS_LIST,
  requirePermission('application:view'),
  validate({ query: listApplicationsQuerySchema }),
  handle(adminController.listApplications.bind(adminController), mapAdminError),
);

router.get(
  ADMIN_API_KEYS_LIST,
  requirePermission('apikey:view'),
  validate({ query: listApiKeysQuerySchema }),
  handle(adminController.listApiKeys.bind(adminController), mapAdminError),
);

router.get(
  ADMIN_SESSIONS_LIST_FOR_USER,
  requirePermission('session:view'),
  validate({ params: objectIdParamSchema('userId') }),
  handle(adminController.listSessionsForUser.bind(adminController), mapAdminError),
);

router.delete(
  ADMIN_SESSIONS_REVOKE,
  requirePermission('session:revoke'),
  validate({ params: objectIdParamSchema('userId') }),
  handle(adminController.revokeSession.bind(adminController), mapAdminError),
);

router.get(
  ADMIN_SYSTEM_SETTINGS,
  requirePermission('system:settings:view'),
  handle(adminController.getSystemSettings.bind(adminController), mapAdminError),
);

router.patch(
  ADMIN_SYSTEM_SETTINGS,
  // No platform role grants 'system:settings:update' explicitly (see
  // platform-roles.ts) - only Owner's ALL_PERMISSIONS sentinel covers
  // it, matching the doc's "Cannot: Change platform configuration" for
  // every role but Owner.
  requirePermission('system:settings:update'),
  validate({ body: updateSystemSettingsSchema }),
  handle(adminController.updateSystemSettings.bind(adminController), mapAdminError),
);

export default router;
