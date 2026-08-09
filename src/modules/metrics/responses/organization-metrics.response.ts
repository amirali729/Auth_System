export class OrganizationMetricsResponse {
  constructor(
    public readonly total: number,
    public readonly active: number,
    public readonly suspended: number,
    public readonly byPlan: { free: number; pro: number; enterprise: number },
    public readonly createdLast7Days: number,
    public readonly createdLast30Days: number,
  ) {}
}
