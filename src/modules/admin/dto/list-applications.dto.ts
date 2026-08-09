export class AdminListApplicationsDto {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    /** Omitted = every organization's applications. */
    public readonly tenantId?: string,
  ) {}
}
