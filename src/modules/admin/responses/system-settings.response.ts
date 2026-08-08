import type { DefaultOrganizationPlan } from '../model/system-settings.model.js';

export class SystemSettingsResponse {
  constructor(
    public readonly allowSignups: boolean,
    public readonly maintenanceMode: boolean,
    public readonly maintenanceMessage: string | undefined,
    public readonly defaultOrganizationPlan: DefaultOrganizationPlan,
    public readonly supportEmail: string | undefined,
    public readonly updatedAt: Date,
  ) {}
}
