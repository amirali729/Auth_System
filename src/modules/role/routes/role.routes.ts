import { Router } from 'express';

import { auditService } from '../../audit/routes/audit.routes.js';
import { PermissionRepository } from '../../permission/repository/permission.repository.impl.js';
import { RoleController } from '../controller/role.controller.impl.js';
import { mapRoleError } from '../http/map-role-error.js';
import { MembershipRoleRepository } from '../repository/membership-role.repository.impl.js';
import { RoleRepository } from '../repository/role.repository.impl.js';
import { RoleService } from '../service/role.service.impl.js';

import { handle } from '../../../shared/http/handle.js';
import { HttpStatus } from '../../../shared/http/http-status.js';
import { validate } from '../../../shared/http/validate.js';
import { requirePermission } from '../../../shared/security/middleware/requirePermission.middleware.js';
import { resolveTenant } from '../../../shared/security/middleware/resolveTenant.middleware.js';
import { verifyjwt } from '../../../shared/security/middleware/verifyJwt.middleware.js';
import { objectIdParamSchema } from '../../../shared/validation/object-id.schema.js';

import {
  assignRoleBodySchema,
  assignRoleParamsSchema,
  createRoleSchema,
  removeRoleParamsSchema,
  setRolePermissionsSchema,
  updateRoleSchema,
} from '../validation/role.schemas.js';

import {
  ROLE_ASSIGN_TO_USER,
  ROLE_CREATE,
  ROLE_DELETE,
  ROLE_GET_BY_ID,
  ROLE_LIST,
  ROLE_REMOVE_FROM_USER,
  ROLE_SET_PERMISSIONS,
  ROLE_UPDATE,
} from '../../../shared/api-endpoint/role.api.endpoint.js';

const router = Router();

const roleRepository = new RoleRepository();
const permissionRepository = new PermissionRepository();
const membershipRoleRepository = new MembershipRoleRepository();

const roleService = new RoleService(
  roleRepository,
  permissionRepository,
  membershipRoleRepository,
  auditService,
);
const roleController = new RoleController(roleService);

// SECURITY FIX (authorization audit): this router was missing
// verifyjwt entirely, so req.user was never set. resolveTenant then
// took its "no authenticated caller" branch and set req.tenantId
// straight from the X-Tenant-ID header with NO membership check at
// all. requirePermission below does independently reject when
// req.user is undefined (see requirePermission.middleware.ts), so the
// net effect was every Role route 401ing rather than an open bypass -
// but it meant the entire Role module (core to the Membership-based
// RBAC design) never actually worked. verifyjwt MUST run before
// resolveTenant - resolveTenant's membership check depends on req.user
// already being set.
router.use(verifyjwt, resolveTenant);

router.get(
  ROLE_LIST,
  requirePermission('role:view'),
  handle(roleController.list.bind(roleController), mapRoleError),
);

router.get(
  ROLE_GET_BY_ID,
  requirePermission('role:view'),
  validate({ params: objectIdParamSchema('id') }),
  handle(roleController.getById.bind(roleController), mapRoleError),
);

router.post(
  ROLE_CREATE,
  requirePermission('role:create'),
  validate({ body: createRoleSchema }),
  handle(roleController.create.bind(roleController), mapRoleError, HttpStatus.CREATED),
);

router.patch(
  ROLE_UPDATE,
  requirePermission('role:update'),
  validate({
    params: objectIdParamSchema('id'),
    body: updateRoleSchema,
  }),
  handle(roleController.updateMeta.bind(roleController), mapRoleError),
);

router.put(
  ROLE_SET_PERMISSIONS,
  requirePermission('role:update'),
  validate({
    params: objectIdParamSchema('id'),
    body: setRolePermissionsSchema,
  }),
  handle(roleController.setPermissions.bind(roleController), mapRoleError),
);

router.delete(
  ROLE_DELETE,
  requirePermission('role:delete'),
  validate({ params: objectIdParamSchema('id') }),
  handle(roleController.delete.bind(roleController), mapRoleError),
);

router.post(
  ROLE_ASSIGN_TO_USER,
  requirePermission('role:update'),
  validate({
    params: assignRoleParamsSchema,
    body: assignRoleBodySchema,
  }),
  handle(roleController.assignToUser.bind(roleController), mapRoleError),
);

router.delete(
  ROLE_REMOVE_FROM_USER,
  requirePermission('role:update'),
  validate({ params: removeRoleParamsSchema }),
  handle(roleController.removeFromUser.bind(roleController), mapRoleError),
);

export default router;
