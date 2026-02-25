import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ContactsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(searchTerm?: string, userProfile?: { id: string; role: string }, includeAll = false) {
    const client = this.supabaseService.getClient();

    // Jointures : profiles (alias assigned_commercial) et companies (alias company)
    let query = client
      .from('contacts')
      .select(`
        *,
        assigned_commercial:profiles!contacts_assigned_to_fkey ( email ),
        company:companies!contacts_company_id_fkey ( name, address, town )
      `);

    // Recherche multicritère : Nom, Email, Téléphone
    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }

    // Sécurité : Le commercial ne voit que ses fiches + les non assignées
    if (!includeAll && userProfile?.role === 'commercial') {
      query = query.or(`assigned_to.eq.${userProfile.id},assigned_to.is.null`);
    }

    const { data, error } = await query.order('last_name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findOne(id: string, userProfile?: { id: string; role: string }, includeAll = false) {
    const client = this.supabaseService.getClient();

    let query = client
      .from('contacts')
      .select(`
        *,
        assigned_commercial:profiles!contacts_assigned_to_fkey ( email ),
        company:companies!contacts_company_id_fkey ( id, name, industry, website, address, town )
      `)
      .eq('id', id);

    if (!includeAll && userProfile?.role === 'commercial') {
      query = query.or(`assigned_to.eq.${userProfile.id},assigned_to.is.null`);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async findCompanyDetails(companyId: string, userProfile?: { id: string; role: string }, includeAll = false) {
    const client = this.supabaseService.getClient();

    const { data: company, error: companyError } = await client
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .maybeSingle();

    if (companyError) throw new Error(companyError.message);
    if (!company) return null;

    let contactsQuery = client
      .from('contacts')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        assigned_to,
        assigned_commercial:profiles!contacts_assigned_to_fkey ( email )
      `)
      .eq('company_id', companyId)
      .order('last_name', { ascending: true });

    if (!includeAll && userProfile?.role === 'commercial') {
      contactsQuery = contactsQuery.or(`assigned_to.eq.${userProfile.id},assigned_to.is.null`);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) throw new Error(contactsError.message);

    // Fetch leads associated with the company
    const { data: leads, error: leadsError } = await client
      .from('leads')
      .select('id, title, status, estimated_value')
      .eq('company_id', companyId);

    if (leadsError) throw new Error(leadsError.message);

    return {
      ...company,
      contacts: contacts || [],
      leads: leads || [],
    };
  }

  async findCompanies(searchTerm?: string) {
    const client = this.supabaseService.getClient();

    let query = client
      .from('companies')
      .select('id, name, industry, website, address, town')
      .order('name', { ascending: true });

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,industry.ilike.%${searchTerm}%,town.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data || [];
  }

  async createCompany(companyData: any) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateCompany(id: string, companyData: any) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('companies')
      .update(companyData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteCompany(id: string) {
    const client = this.supabaseService.getClient();
    const { error } = await client.from('companies').delete().eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  async create(contactData: any) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client.from('contacts').insert(contactData).select().single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, contactData: any) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('contacts')
      .update(contactData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string) {
    const client = this.supabaseService.getClient();
    const { error } = await client.from('contacts').delete().eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  async getContactNotes(contactId: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('contact_notes')
      .select(`
        *,
        author:profiles!contact_notes_author_id_fkey ( email )
      `)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async createContactNote(contactId: string, content: string, type: string, authorId?: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('contact_notes')
      .insert([
        {
          contact_id: contactId,
          content,
          type,
          author_id: authorId,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}