export class CreateCommunicationDto {
  recipient_email: string;
  subject: string;
  body?: string;
  contact_id?: string;
  lead_id?: string;
  channel?: 'email';
  template_key?: string;
  trigger_type?: 'manual' | 'automation';
}
