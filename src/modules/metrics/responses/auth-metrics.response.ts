export class AuthMetricsResponse {
  constructor(
    public readonly totalUsers: number,
    public readonly verifiedUsers: number,
    public readonly activeAccounts: number,
    public readonly deactivatedAccounts: number,
    public readonly lockedAccounts: number,
    public readonly signupsLast7Days: number,
    public readonly signupsLast30Days: number,
    public readonly loginsSucceededLast24h: number,
    public readonly loginsFailedLast24h: number,
  ) {}
}
