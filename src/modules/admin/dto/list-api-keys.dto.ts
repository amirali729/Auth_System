export class AdminListApiKeysDto {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly applicationId?: string,
    public readonly status?: 'active' | 'revoked',
  ) {}
}
