import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(user?: { id: string; role: string }) {
    const client = this.supabaseService.getClient();

    let query = client
      .from('tasks')
      .select(`*,
        contact:contact_id (
          id,
          first_name,
          last_name,
          email
        ),
        lead:lead_id (
          id,
          title,
          status
        )
      `)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (user?.role !== 'admin' && user?.id) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur chargement tasks:', error);
      return [];
    }

    return data;
  }

  async create(createTaskDto: CreateTaskDto, userId?: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('tasks')
      .insert([
        {
          title: createTaskDto.title,
          due_date: createTaskDto.due_date || null,
          contact_id: createTaskDto.contact_id || null,
          lead_id: createTaskDto.lead_id || null,
          is_completed: false,
          user_id: userId || null,
        },
      ])
      .select(`*,
        contact:contact_id (
          id,
          first_name,
          last_name,
          email
        ),
        lead:lead_id (
          id,
          title,
          status
        )
      `)
      .single();

    if (error) {
      console.error('Erreur création task:', error);
      throw error;
    }

    return data;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user?: { id: string; role: string }) {
    const client = this.supabaseService.getClient();

    const updates: Record<string, unknown> = {};
    if (updateTaskDto.title !== undefined) updates.title = updateTaskDto.title;
    if (updateTaskDto.due_date !== undefined) updates.due_date = updateTaskDto.due_date;
    if (updateTaskDto.contact_id !== undefined) updates.contact_id = updateTaskDto.contact_id;
    if (updateTaskDto.lead_id !== undefined) updates.lead_id = updateTaskDto.lead_id;
    if (updateTaskDto.is_completed !== undefined) updates.is_completed = updateTaskDto.is_completed;

    const { data, error } =
      user?.role !== 'admin' && user?.id
        ? await client
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select(`*,
              contact:contact_id (
                id,
                first_name,
                last_name,
                email
              ),
              lead:lead_id (
                id,
                title,
                status
              )
            `)
            .single()
        : await client
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select(`*,
              contact:contact_id (
                id,
                first_name,
                last_name,
                email
              ),
              lead:lead_id (
                id,
                title,
                status
              )
            `)
            .single();

    if (error) {
      console.error('Erreur update task:', error);
      throw error;
    }

    return data;
  }

  async delete(id: string, user?: { id: string; role: string }) {
    const client = this.supabaseService.getClient();

    const { error } =
      user?.role !== 'admin' && user?.id
        ? await client.from('tasks').delete().eq('id', id).eq('user_id', user.id)
        : await client.from('tasks').delete().eq('id', id);

    if (error) {
      console.error('Erreur suppression task:', error);
      throw error;
    }

    return { success: true };
  }
}
