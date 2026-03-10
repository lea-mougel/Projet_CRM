export class UpdateAutomationSettingsDto {
  enabled?: boolean;
  subject?: string;
  body?: string;
  cooldown_hours?: number;
  daily_limit_per_recipient?: number;
  target?: 'contact' | 'commercial';
  target_commercial_id?: string | null;
  target_lead_id?: string | null;
}
