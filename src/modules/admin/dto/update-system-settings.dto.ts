import type { DefaultOrganizationPlan } from '../model/system-settings.model.js';

export class UpdateSystemSettingsDto {
  constructor(
    public readonly allowSignups?: boolean,
    public readonly maintenanceMode?: boolean,
    public readonly maintenanceMessage?: string,
    public readonly defaultOrganizationPlan?: DefaultOrganizationPlan,
    public readonly supportEmail?: string,
  ) {}
}
