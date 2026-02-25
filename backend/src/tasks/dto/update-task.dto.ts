export class UpdateTaskDto {
  title?: string;
  due_date?: string | null;
  contact_id?: string | null;
  lead_id?: string | null;
  is_completed?: boolean;
}
