export class UpdateCommunicationStatusDto {
  status: 'pending' | 'sent' | 'failed';
  provider_message_id?: string;
  error_message?: string;
  sent_at?: string;
}
