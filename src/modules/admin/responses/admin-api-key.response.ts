export class AdminApiKeyResponse {
  constructor(
    public readonly id: string,
    public readonly applicationId: string,
    public readonly name: string,
    public readonly keyPrefix: string,
    public readonly status: 'active' | 'revoked',
    public readonly expiresAt: Date | undefined,
    public readonly lastUsedAt: Date | undefined,
    public readonly createdAt: Date,
  ) {}
}

export class AdminApiKeyListResponse {
  constructor(
    public readonly apiKeys: AdminApiKeyResponse[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
