export class AdminApplicationResponse {
  constructor(
    public readonly id: string,
    /** Undefined in single-tenant self-hosted deployments. */
    public readonly tenantId: string | undefined,
    public readonly name: string,
    public readonly clientId: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}
}

export class AdminApplicationListResponse {
  constructor(
    public readonly applications: AdminApplicationResponse[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
