import { z } from 'zod';
import { PLATFORM_ROLES } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/security/authorization/platform-roles.js';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).max(200).optional(),
  platformRole: z.enum(PLATFORM_ROLES).optional(),
  status: z.enum(['active', 'deactivated']).optional(),
});

export const updateUserSchema = z
  .object({
    platformRole: z.enum(PLATFORM_ROLES).optional(),
    status: z.enum(['active', 'deactivated']).optional(),
  })
  .refine((body) => body.platformRole !== undefined || body.status !== undefined, {
    message: 'At least one of platformRole or status must be provided.',
  });

export const listApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  tenantId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid organization id.')
    .optional(),
});

export const listApiKeysQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  applicationId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid application id.')
    .optional(),
  status: z.enum(['active', 'revoked']).optional(),
});

export const updateSystemSettingsSchema = z.object({
  allowSignups: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().trim().max(500).optional(),
  defaultOrganizationPlan: z.enum(['free', 'pro', 'enterprise']).optional(),
  supportEmail: z.string().trim().email('Must be a valid email.').optional(),
});
