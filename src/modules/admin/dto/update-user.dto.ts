import type { PlatformRole } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/security/authorization/platform-roles.js';

export class UpdateUserDto {
  constructor(
    public readonly platformRole?: PlatformRole,
    public readonly status?: 'active' | 'deactivated',
  ) {}
}
