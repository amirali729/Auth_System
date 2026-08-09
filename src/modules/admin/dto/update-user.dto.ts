import type { PlatformRole } from '../../../shared/security/authorization/platform-roles.js';

export class UpdateUserDto {
  constructor(
    public readonly platformRole?: PlatformRole,
    public readonly status?: 'active' | 'deactivated',
  ) {}
}
