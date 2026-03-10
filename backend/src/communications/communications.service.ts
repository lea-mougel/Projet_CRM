import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { SendCommunicationDto } from './dto/send-communication.dto';
import { UpdateAutomationSettingsDto } from './dto/update-automation-settings.dto';
import { UpdateCommunicationStatusDto } from './dto/update-communication-status.dto';

@Injectable()
export class CommunicationsService {
  private readonly settingsKeys = {
    enabled: 'communications_auto_send_enabled',
    subject: 'communications_auto_subject',
    body: 'communications_auto_body',
    cooldownHours: 'communications_auto_cooldown_hours',
    dailyLimitPerRecipient: 'communications_auto_daily_limit_per_recipient',
    target: 'communications_auto_target',
    targetCommercialId: 'communications_auto_target_commercial_id',
    targetLeadId: 'communications_auto_target_lead_id',
  };

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async getAutomationSettings(): Promise<{
    enabled: boolean;
    subject: string;
    body: string;
    cooldown_hours: number;
    daily_limit_per_recipient: number;
    target: 'contact' | 'commercial';
    target_commercial_id: string | null;
    target_lead_id: string | null;
  }> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('app_settings')
      .select('key, value_bool, value_text')
      .in('key', [
        this.settingsKeys.enabled,
        this.settingsKeys.subject,
        this.settingsKeys.body,
        this.settingsKeys.cooldownHours,
        this.settingsKeys.dailyLimitPerRecipient,
        this.settingsKeys.target,
        this.settingsKeys.targetCommercialId,
        this.settingsKeys.targetLeadId,
      ]);

    if (error) {
      console.error('Erreur lecture app_settings:', error);
      if ((error as { code?: string })?.code === '42P01') {
        throw new Error(
          'Table app_settings absente. Exécutez backend/sql/feature7_step3_automation_settings.sql',
        );
      }
      return {
        enabled: true,
        subject: 'Votre acces d\'essai 3DEXPERIENCE est active',
        body: '<p>Bonjour {{contact_first_name}},</p><p>Merci d\'avoir telecharge la version d\'essai de notre solution 3DEXPERIENCE.</p><p>Votre acces est maintenant actif.</p><p>Demarrer votre essai: <a href="{{trial_link}}">{{trial_link}}</a></p><p>Si vous le souhaitez, nous pouvons planifier une demonstration ciblee de 20 minutes adaptee a vos enjeux.</p><p>Cordialement,<br/>L\'equipe CRM / Sales Engineering</p>',
        cooldown_hours: 24,
        daily_limit_per_recipient: 2,
        target: 'contact',
        target_commercial_id: null,
        target_lead_id: null,
      };
    }

    const rows = (data || []) as Array<{ key: string; value_bool?: boolean | null; value_text?: string | null }>;
    const byKey = Object.fromEntries(rows.map((row) => [row.key, row]));

    const cooldown = Number(byKey[this.settingsKeys.cooldownHours]?.value_text ?? '24');
    const dailyLimit = Number(byKey[this.settingsKeys.dailyLimitPerRecipient]?.value_text ?? '2');
    const rawTarget = byKey[this.settingsKeys.target]?.value_text;
    const target: 'contact' | 'commercial' = rawTarget === 'commercial' ? 'commercial' : 'contact';

    return {
      enabled: byKey[this.settingsKeys.enabled]?.value_bool ?? true,
      subject:
        byKey[this.settingsKeys.subject]?.value_text || 'Votre acces d\'essai 3DEXPERIENCE est active',
      body:
        byKey[this.settingsKeys.body]?.value_text ||
        '<p>Bonjour {{contact_first_name}},</p><p>Merci d\'avoir telecharge la version d\'essai de notre solution 3DEXPERIENCE.</p><p>Votre acces est maintenant actif.</p><p>Demarrer votre essai: <a href="{{trial_link}}">{{trial_link}}</a></p><p>Si vous le souhaitez, nous pouvons planifier une demonstration ciblee de 20 minutes adaptee a vos enjeux.</p><p>Cordialement,<br/>L\'equipe CRM / Sales Engineering</p>',
      cooldown_hours: Number.isNaN(cooldown) ? 24 : Math.max(0, cooldown),
      daily_limit_per_recipient: Number.isNaN(dailyLimit) ? 2 : Math.max(1, dailyLimit),
      target,
      target_commercial_id: byKey[this.settingsKeys.targetCommercialId]?.value_text || null,
      target_lead_id: byKey[this.settingsKeys.targetLeadId]?.value_text || null,
    };
  }

  async isAutomationEnabled(): Promise<boolean> {
    const settings = await this.getAutomationSettings();
    return settings.enabled;
  }

  async updateAutomationSettings(dto: UpdateAutomationSettingsDto, user?: { id: string; role: string }) {
    const client = this.supabaseService.getClient();

    const rows: Array<{ key: string; value_bool?: boolean; value_text?: string; updated_at: string; updated_by: string | null }> = [];
    const now = new Date().toISOString();

    if (dto.enabled !== undefined) {
      rows.push({
        key: this.settingsKeys.enabled,
        value_bool: dto.enabled,
        updated_at: now,
        updated_by: user?.id || null,
      });
    }
    if (dto.subject !== undefined) {
      rows.push({
        key: this.settingsKeys.subject,
        value_text: dto.subject,
        updated_at: now,
        updated_by: user?.id || null,
      });
    }
    if (dto.body !== undefined) {
      rows.push({
        key: this.settingsKeys.body,
        value_text: dto.body,
        updated_at: now,
        updated_by: user?.id || null,
      });
    }
    if (dto.cooldown_hours !== undefined) {
      rows.push({
        key: this.settingsKeys.cooldownHours,
        value_text: String(Math.max(0, dto.cooldown_hours)),
        updated_at: now,
        updated_by: user?.id || null,
      });
    }
    if (dto.daily_limit_per_recipient !== undefined) {
      rows.push({
        key: this.settingsKeys.dailyLimitPerRecipient,
        value_text: String(Math.max(1, dto.daily_limit_per_recipient)),
        updated_at: now,
        updated_by: user?.id || null,
      });
    }
    if (dto.target !== undefined) {
      const target = dto.target === 'commercial' ? 'commercial' : 'contact';
      rows.push({
        key: this.settingsKeys.target,
        value_text: target,
        updated_at: now,
        updated_by: user?.id || null,
      });
    }
    if (dto.target_commercial_id !== undefined) {
      rows.push({
        key: this.settingsKeys.targetCommercialId,
        value_text: dto.target_commercial_id || '',
        updated_at: now,
        updated_by: user?.id || null,
      });
    }
    if (dto.target_lead_id !== undefined) {
      rows.push({
        key: this.settingsKeys.targetLeadId,
        value_text: dto.target_lead_id || '',
        updated_at: now,
        updated_by: user?.id || null,
      });
    }

    if (rows.length === 0) {
      return this.getAutomationSettings();
    }

    const { error } = await client
      .from('app_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) {
      console.error('Erreur update app_settings:', error);
      if ((error as { code?: string })?.code === '42P01') {
        throw new Error(
          'Table app_settings absente. Exécutez backend/sql/feature7_step3_automation_settings.sql',
        );
      }
      throw error;
    }

    return this.getAutomationSettings();
  }

  async findAll(user?: { id: string; role: string }) {
    const client = this.supabaseService.getClient();

    let query = client
      .from('communications')
      .select(`
        *,
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
      .order('created_at', { ascending: false });

    if (user?.role !== 'admin' && user?.id) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur chargement communications:', error);
      return [];
    }

    return data;
  }

  async create(createCommunicationDto: CreateCommunicationDto, user?: { id: string; role: string }) {
    const client = this.supabaseService.getClient();

    const payload = {
      recipient_email: createCommunicationDto.recipient_email,
      subject: createCommunicationDto.subject,
      body: createCommunicationDto.body || null,
      contact_id: createCommunicationDto.contact_id || null,
      lead_id: createCommunicationDto.lead_id || null,
      channel: createCommunicationDto.channel || 'email',
      template_key: createCommunicationDto.template_key || null,
      trigger_type: createCommunicationDto.trigger_type || 'manual',
      status: 'pending',
      user_id: user?.id || null,
    };

    const { data, error } = await client
      .from('communications')
      .insert([payload])
      .select(`
        *,
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
      console.error('Erreur création communication:', error);
      throw error;
    }

    return data;
  }

  async send(sendCommunicationDto: SendCommunicationDto, user?: { id: string; role: string }) {
    const communication = await this.create(
      {
        recipient_email: sendCommunicationDto.recipient_email,
        subject: sendCommunicationDto.subject,
        body: sendCommunicationDto.body,
        contact_id: sendCommunicationDto.contact_id,
        lead_id: sendCommunicationDto.lead_id,
        channel: 'email',
        template_key: sendCommunicationDto.template_key,
        trigger_type: sendCommunicationDto.trigger_type || 'manual',
      },
      user,
    );

    try {
      const providerMessageId = await this.sendViaBrevo(sendCommunicationDto);

      return await this.updateStatus(
        communication.id,
        {
          status: 'sent',
          provider_message_id: providerMessageId,
        },
        user,
      );
    } catch (error) {
      await this.updateStatus(
        communication.id,
        {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Erreur inconnue Brevo',
        },
        user,
      );

      throw error;
    }
  }

  async updateStatus(
    id: string,
    updateCommunicationStatusDto: UpdateCommunicationStatusDto,
    user?: { id: string; role: string },
  ) {
    const client = this.supabaseService.getClient();

    const updates: Record<string, unknown> = {
      status: updateCommunicationStatusDto.status,
    };

    if (updateCommunicationStatusDto.provider_message_id !== undefined) {
      updates.provider_message_id = updateCommunicationStatusDto.provider_message_id;
    }
    if (updateCommunicationStatusDto.error_message !== undefined) {
      updates.error_message = updateCommunicationStatusDto.error_message;
    }

    if (updateCommunicationStatusDto.sent_at !== undefined) {
      updates.sent_at = updateCommunicationStatusDto.sent_at;
    } else if (updateCommunicationStatusDto.status === 'sent') {
      updates.sent_at = new Date().toISOString();
    }

    const { data, error } =
      user?.role !== 'admin' && user?.id
        ? await client
            .from('communications')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select('*')
            .single()
        : await client.from('communications').update(updates).eq('id', id).select('*').single();

    if (error) {
      console.error('Erreur update communication:', error);
      throw error;
    }

    return data;
  }

  private async sendViaBrevo(sendCommunicationDto: SendCommunicationDto): Promise<string | undefined> {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    const senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL');
    const senderName = this.configService.get<string>('BREVO_SENDER_NAME') || 'CRM';

    if (!apiKey) {
      throw new Error('BREVO_API_KEY manquante dans les variables d\'environnement');
    }

    if (!senderEmail) {
      throw new Error('BREVO_SENDER_EMAIL manquante dans les variables d\'environnement');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          email: senderEmail,
          name: senderName,
        },
        to: [{ email: sendCommunicationDto.recipient_email }],
        subject: sendCommunicationDto.subject,
        htmlContent: sendCommunicationDto.body || '<p>Message CRM</p>',
      }),
    });

    const raw = await response.text();
    let payload: Record<string, unknown> = {};

    try {
      payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      payload = {};
    }

    if (!response.ok) {
      const providerMessage =
        (typeof payload.message === 'string' && payload.message) ||
        (typeof payload.code === 'string' && payload.code) ||
        `HTTP ${response.status}`;
      throw new Error(`Brevo: ${providerMessage}`);
    }

    return typeof payload.messageId === 'string' ? payload.messageId : undefined;
  }
}
