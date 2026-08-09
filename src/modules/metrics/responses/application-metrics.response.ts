export class ApplicationMetricsResponse {
  constructor(
    public readonly total: number,
    public readonly active: number,
    public readonly inactive: number,
    public readonly createdLast7Days: number,
    public readonly createdLast30Days: number,
  ) {}
}
