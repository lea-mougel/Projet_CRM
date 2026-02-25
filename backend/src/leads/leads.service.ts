import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('leads')
      .select(`*,
        contacts:contact_id (
          id,
          first_name,
          last_name,
          email
        ),
        companies:company_id (
          id,
          name
        ),
        assigned_commercial:assigned_to (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur Supabase Leads:', error);
      return [];
    }

    return data;
  }

  async findById(id: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('leads')
      .select(`*,
        contacts:contact_id (
          id,
          first_name,
          last_name,
          email
        ),
        companies:company_id (
          id,
          name,
          industry
        ),
        assigned_commercial:assigned_to (
          id,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur Supabase Lead:', error);
      return null;
    }

    return data;
  }

  async create(createLeadDto: CreateLeadDto, userId?: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('leads')
      .insert([
        {
          title: createLeadDto.title,
          estimated_value: createLeadDto.estimated_value || 0,
          status: createLeadDto.status || 'nouveau',
          company_id: createLeadDto.company_id || null,
          contact_id: createLeadDto.contact_id || null,
          source: createLeadDto.source || null,
          description: createLeadDto.description || null,
          assigned_to: userId || null,
        },
      ])
      .select(`*,
        contacts:contact_id (
          id,
          first_name,
          last_name,
          email
        ),
        companies:company_id (
          id,
          name,
          industry
        ),
        assigned_commercial:assigned_to (
          id,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Erreur création lead:', error);
      throw error;
    }

    return data;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto) {
    const client = this.supabaseService.getClient();
    const updates: any = {};

    if (updateLeadDto.title !== undefined) updates.title = updateLeadDto.title;
    if (updateLeadDto.estimated_value !== undefined) updates.estimated_value = updateLeadDto.estimated_value;
    if (updateLeadDto.status !== undefined) updates.status = updateLeadDto.status;
    if (updateLeadDto.company_id !== undefined) updates.company_id = updateLeadDto.company_id;
    if (updateLeadDto.contact_id !== undefined) updates.contact_id = updateLeadDto.contact_id;
    if (updateLeadDto.source !== undefined) updates.source = updateLeadDto.source;
    if (updateLeadDto.description !== undefined) updates.description = updateLeadDto.description;

    const { data, error } = await client
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select(`*,
        contacts:contact_id (
          id,
          first_name,
          last_name,
          email
        ),
        companies:company_id (
          id,
          name,
          industry
        ),
        assigned_commercial:assigned_to (
          id,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Erreur update lead:', error);
      throw error;
    }

    return data;
  }

  async delete(id: string) {
    const client = this.supabaseService.getClient();
    const { error } = await client.from('leads').delete().eq('id', id);

    if (error) {
      console.error('Erreur delete lead:', error);
      throw error;
    }

    return { success: true };
  }
}