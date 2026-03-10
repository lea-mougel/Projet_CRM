import { BadRequestException, Injectable } from '@nestjs/common';
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

  private readonly leadSelect = `*,
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
      `;

  private mapStatusToDatabase(status?: string | null): 'nouveau' | 'en cours' | 'converti' | 'perdu' {
    if (!status) return 'nouveau';

    const trimmed = status.trim();
    const lower = trimmed.toLowerCase();

    // Legacy statuses already stored in DB.
    if (lower === 'nouveau') return 'nouveau';
    if (lower === 'en cours') return 'en cours';
    if (lower === 'converti') return 'converti';
    if (lower === 'perdu') return 'perdu';

    // New business pipeline statuses used by frontend UI.
    if (trimmed === 'Nouveau Lead') return 'nouveau';
    if (trimmed === 'Decouverte des besoins (Audit)' || trimmed === 'Découverte des besoins (Audit)') return 'en cours';
    if (trimmed === 'Demonstration 3DEXPERIENCE' || trimmed === 'Démonstration 3DEXPERIENCE') return 'en cours';
    if (trimmed === 'POC (Proof of Concept)') return 'en cours';
    if (trimmed === 'Negociation contractuelle' || trimmed === 'Négociation contractuelle') return 'en cours';
    if (trimmed === 'Gagne' || trimmed === 'Gagné') return 'converti';
    if (trimmed === 'Perdu') return 'perdu';

    // Safe fallback prevents DB CHECK constraint violations.
    return 'nouveau';
  }

  private mapStatusToNewPipeline(status?: string | null):
    | 'Nouveau Lead'
    | 'Decouverte des besoins (Audit)'
    | 'Demonstration 3DEXPERIENCE'
    | 'POC (Proof of Concept)'
    | 'Negociation contractuelle'
    | 'Gagne'
    | 'Perdu' {
    if (!status) return 'Nouveau Lead';

    const trimmed = status.trim();
    const lower = trimmed.toLowerCase();

    if (trimmed === 'Nouveau Lead') return 'Nouveau Lead';
    if (trimmed === 'Decouverte des besoins (Audit)' || trimmed === 'Découverte des besoins (Audit)') return 'Decouverte des besoins (Audit)';
    if (trimmed === 'Demonstration 3DEXPERIENCE' || trimmed === 'Démonstration 3DEXPERIENCE') return 'Demonstration 3DEXPERIENCE';
    if (trimmed === 'POC (Proof of Concept)') return 'POC (Proof of Concept)';
    if (trimmed === 'Negociation contractuelle' || trimmed === 'Négociation contractuelle') return 'Negociation contractuelle';
    if (trimmed === 'Gagne' || trimmed === 'Gagné') return 'Gagne';
    if (trimmed === 'Perdu') return 'Perdu';

    if (lower === 'nouveau') return 'Nouveau Lead';
    if (lower === 'en cours') return 'Decouverte des besoins (Audit)';
    if (lower === 'converti') return 'Gagne';
    if (lower === 'perdu') return 'Perdu';

    return 'Nouveau Lead';
  }

  private getStatusCandidates(status?: string | null): string[] {
    const fromInput = status?.trim();
    const legacy = this.mapStatusToDatabase(status);
    const newPipeline = this.mapStatusToNewPipeline(status);
    return [fromInput, legacy, newPipeline].filter((value, index, arr): value is string => !!value && arr.indexOf(value) === index);
  }

  private isStatusConstraintViolation(error: any): boolean {
    return typeof error?.message === 'string' && error.message.includes('leads_status_check');
  }

  async findAll(user?: { id: string; role: string }) {
    const client = this.supabaseService.getClient();
    let query = client
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
      `);

    if (user?.role === 'commercial') {
      query = query.eq('assigned_to', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

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
    const statuses = this.getStatusCandidates(createLeadDto.status);
    let lastStatusError: any = null;

    for (const status of statuses) {
      const { data, error } = await client
        .from('leads')
        .insert([
          {
            title: createLeadDto.title,
            estimated_value: createLeadDto.estimated_value || 0,
            status,
            company_id: createLeadDto.company_id || null,
            contact_id: createLeadDto.contact_id || null,
            source: createLeadDto.source || null,
            description: createLeadDto.description || null,
            assigned_to: userId || null,
          },
        ])
        .select(this.leadSelect)
        .single();

      if (!error) {
        return data;
      }

      if (this.isStatusConstraintViolation(error)) {
        lastStatusError = error;
        continue;
      }

      console.error('Erreur création lead:', error);
      throw new BadRequestException(`Impossible de créer le lead: ${error.message}`);
    }

    console.error('Erreur création lead (status incompatible):', lastStatusError);
    throw new BadRequestException(
      `Impossible de créer le lead: ${lastStatusError?.message || 'statut incompatible avec la base'}`,
    );
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
    if (updateLeadDto.company_id !== undefined) updates.company_id = updateLeadDto.company_id;
    if (updateLeadDto.contact_id !== undefined) updates.contact_id = updateLeadDto.contact_id;
    if (updateLeadDto.source !== undefined) updates.source = updateLeadDto.source;
    if (updateLeadDto.description !== undefined) updates.description = updateLeadDto.description;

    let data: any = null;

    if (updateLeadDto.status !== undefined) {
      const statuses = this.getStatusCandidates(updateLeadDto.status);
      let lastStatusError: any = null;

      for (const status of statuses) {
        const { data: updatedData, error } = await client
          .from('leads')
          .update({ ...updates, status })
          .eq('id', id)
          .select(this.leadSelect)
          .single();

        if (!error) {
          data = updatedData;
          break;
        }

        if (this.isStatusConstraintViolation(error)) {
          lastStatusError = error;
          continue;
        }

        console.error('Erreur update lead:', error);
        throw new BadRequestException(`Impossible de mettre à jour le lead: ${error.message}`);
      }

      if (!data) {
        console.error('Erreur update lead (status incompatible):', lastStatusError);
        throw new BadRequestException(
          `Impossible de mettre à jour le lead: ${lastStatusError?.message || 'statut incompatible avec la base'}`,
        );
      }
    } else {
      const { data: updatedData, error } = await client
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select(this.leadSelect)
        .single();

      if (error) {
        console.error('Erreur update lead:', error);
        throw new BadRequestException(`Impossible de mettre à jour le lead: ${error.message}`);
      }

      data = updatedData;
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