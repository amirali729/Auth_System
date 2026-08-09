import type { Document, Types } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export type DefaultOrganizationPlan = 'free' | 'pro' | 'enterprise';

/**
 * Deliberately a single document rather than a key/value collection -
 * there is exactly one of these per deployment (see
 * repository/admin.repository.impl.ts's getOrCreate(), which always
 * queries/creates the same fixed `_id`), and a fixed shape lets every
 * field be validated/typed like any other model instead of trusting
 * whatever a generic key/value store happens to contain.
 */
export interface ISystemSettings extends Document {
  allowSignups: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  defaultOrganizationPlan: DefaultOrganizationPlan;
  supportEmail?: string;
  updatedBy?: Types.ObjectId;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Fixed id for the one-and-only SystemSettings document. */
export const SYSTEM_SETTINGS_SINGLETON_ID = '000000000000000000000001';

const systemSettingsSchema: Schema = new mongoose.Schema(
  {
    _id: { type: Schema.Types.ObjectId, default: SYSTEM_SETTINGS_SINGLETON_ID },
    allowSignups: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, trim: true, maxlength: 500 },
    defaultOrganizationPlan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    supportEmail: { type: String, trim: true, lowercase: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const SystemSettings = mongoose.model<ISystemSettings>(
  'SystemSettings',
  systemSettingsSchema,
);
