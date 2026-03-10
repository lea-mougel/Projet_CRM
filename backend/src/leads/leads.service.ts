import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CommunicationsService } from '../communications/communications.service';

@Injectable()
export class LeadsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly communicationsService: CommunicationsService,
  ) {}

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

  async update(id: string, updateLeadDto: UpdateLeadDto, user?: { id: string; role: string }) {
    const client = this.supabaseService.getClient();
    const updates: any = {};

    const { data: existingLead } = await client
      .from('leads')
      .select('id, status, contact_id')
      .eq('id', id)
      .maybeSingle();

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

    await this.triggerLeadEnCoursAutomation(existingLead, data, user);

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

  private async triggerLeadEnCoursAutomation(
    previousLead: { id: string; status: string; contact_id?: string | null } | null,
    updatedLead: any,
    user?: { id: string; role: string },
  ) {
    if (!updatedLead) return;

    const previousStatus = previousLead?.status;
    const newStatus = updatedLead.status;

    if (newStatus !== 'en cours' || previousStatus === 'en cours') {
      return;
    }

    const automationSettings = await this.communicationsService.getAutomationSettings();
    if (!automationSettings.enabled) {
      return;
    }

    if (automationSettings.target_lead_id && automationSettings.target_lead_id !== updatedLead.id) {
      return;
    }

    const client = this.supabaseService.getClient();

    let targetEmail: string | undefined;
    if (automationSettings.target === 'commercial') {
      if (automationSettings.target_commercial_id) {
        const { data: targetCommercial } = await client
          .from('profiles')
          .select('id, email')
          .eq('id', automationSettings.target_commercial_id)
          .maybeSingle();
        targetEmail = targetCommercial?.email;
      } else {
        targetEmail = updatedLead?.assigned_commercial?.email;
      }
    } else {
      targetEmail = updatedLead?.contacts?.email;
    }

    if (!targetEmail) {
      return;
    }

    const cooldownSince = new Date(Date.now() - automationSettings.cooldown_hours * 60 * 60 * 1000).toISOString();

    const { data: existingAutomation } = await client
      .from('communications')
      .select('id, status')
      .eq('lead_id', updatedLead.id)
      .eq('trigger_type', 'automation')
      .eq('template_key', 'lead_status_en_cours')
      .in('status', ['pending', 'sent'])
      .gte('created_at', cooldownSince)
      .limit(1)
      .maybeSingle();

    if (existingAutomation) {
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: sentTodayCount } = await client
      .from('communications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_email', targetEmail)
      .eq('status', 'sent')
      .gte('created_at', todayStart.toISOString());

    if ((sentTodayCount || 0) >= automationSettings.daily_limit_per_recipient) {
      return;
    }

    const leadTitle = updatedLead.title || 'CRM';
    const subject = automationSettings.subject.replaceAll('{{lead_title}}', leadTitle);
    const body = automationSettings.body.replaceAll('{{lead_title}}', leadTitle);

    try {
      await this.communicationsService.send(
        {
          recipient_email: targetEmail,
          subject,
          body,
          contact_id: updatedLead.contact_id || previousLead?.contact_id || undefined,
          lead_id: updatedLead.id,
          template_key: 'lead_status_en_cours',
          trigger_type: 'automation',
        },
        user,
      );
    } catch (error) {
      console.error('Erreur automation lead en cours:', error);
    }
  }
}