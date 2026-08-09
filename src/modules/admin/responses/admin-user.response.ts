import type { PlatformRole } from '../../../../../Auth_System_updated (2)/Auth_System/src/shared/security/authorization/platform-roles.js';

export class AdminUserResponse {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
    public readonly fullName: string | undefined,
    public readonly platformRole: PlatformRole,
    public readonly status: 'active' | 'deactivated',
    public readonly isVerified: boolean,
    public readonly failedLoginAttempts: number,
    public readonly lockUntil: Date | undefined,
    public readonly createdAt: Date,
  ) {}
}

export class AdminUserListResponse {
  constructor(
    public readonly users: AdminUserResponse[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}

export interface AdminUserOrganizationSummary {
  id: string;
  name: string;
  slug: string;
  roles: string[];
}

export class AdminUserDetailResponse extends AdminUserResponse {
  constructor(
    id: string,
    username: string,
    email: string,
    fullName: string | undefined,
    platformRole: PlatformRole,
    status: 'active' | 'deactivated',
    isVerified: boolean,
    failedLoginAttempts: number,
    lockUntil: Date | undefined,
    createdAt: Date,
    public readonly organizations: AdminUserOrganizationSummary[],
  ) {
    super(
      id,
      username,
      email,
      fullName,
      platformRole,
      status,
      isVerified,
      failedLoginAttempts,
      lockUntil,
      createdAt,
    );
  }
}
