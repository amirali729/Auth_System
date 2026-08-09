import type { PlatformRole } from '../../../shared/security/authorization/platform-roles.js';

export class ListUsersDto {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    /** Matches against username, email, or fullName (case-insensitive substring). */
    public readonly search?: string,
    public readonly platformRole?: PlatformRole,
    public readonly status?: 'active' | 'deactivated',
  ) {}
}
