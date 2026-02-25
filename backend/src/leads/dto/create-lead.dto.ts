export class CreateLeadDto {
  title: string;
  estimated_value?: number;
  status?: string;
  company_id?: string;
  contact_id?: string;
  source?: string;
  description?: string;
}
