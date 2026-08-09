export class ApiKeyMetricsResponse {
  constructor(
    public readonly total: number,
    public readonly active: number,
    public readonly revoked: number,
    public readonly expiringNext7Days: number,
    public readonly usedLast24h: number,
    public readonly neverUsed: number,
  ) {}
}
