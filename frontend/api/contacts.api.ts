'use client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  company_id?: string | null;
  assigned_to?: string | null;
  company?: {
    id?: string;
    name?: string | null;
    industry?: string | null;
    website?: string | null;
    address?: string | null;
    town?: string | null;
  } | null;
  assigned_commercial?: {
    email?: string | null;
  } | null;
};

export type CompanyDetails = {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  address?: string | null;
  town?: string | null;
  contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
    assigned_to?: string | null;
    assigned_commercial?: {
      email?: string | null;
    } | null;
  }>;
};

export type CompanyListItem = {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  address?: string | null;
  town?: string | null;
};

export type ContactPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_id?: string | null;
};

export type CompanyPayload = {
  name: string;
  industry?: string;
  website?: string;
  address?: string;
  town?: string;
};

export type ContactNote = {
  id: string;
  contact_id: string;
  content: string;
  type: 'note' | 'appel' | 'email' | 'réunion';
  author_id?: string;
  created_at: string;
  author?: {
    email?: string;
  };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (data?.session?.user?.id) {
    headers['X-User-Id'] = data.session.user.id;
  }
  
  return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Erreur API (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const contactsApi = {
  async getAll(search?: string, includeAll?: boolean): Promise<Contact[]> {
    const params = new URLSearchParams();
    if (search?.trim()) params.set('search', search.trim());
    if (includeAll) params.set('includeAll', 'true');

    const query = params.toString();
    const url = `${API_BASE_URL}/contacts${query ? `?${query}` : ''}`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, { method: 'GET', headers });

    return parseResponse<Contact[]>(response);
  },

  async create(payload: ContactPayload): Promise<Contact> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return parseResponse<Contact>(response);
  },

  async update(id: string, payload: ContactPayload): Promise<Contact> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });

    return parseResponse<Contact>(response);
  },

  async remove(id: string): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers,
    });

    return parseResponse<{ success: boolean }>(response);
  },

  async getById(id: string, includeAll?: boolean): Promise<Contact | null> {
    const params = new URLSearchParams();
    if (includeAll) params.set('includeAll', 'true');
    const query = params.toString();
    const response = await fetch(`${API_BASE_URL}/contacts/${id}${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    return parseResponse<Contact | null>(response);
  },

  async getCompanyById(companyId: string, includeAll?: boolean): Promise<CompanyDetails | null> {
    const params = new URLSearchParams();
    if (includeAll) params.set('includeAll', 'true');
    const query = params.toString();

    const response = await fetch(`${API_BASE_URL}/contacts/companies/${companyId}${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    return parseResponse<CompanyDetails | null>(response);
  },

  async getCompanies(search?: string): Promise<CompanyListItem[]> {
    const params = new URLSearchParams();
    if (search?.trim()) params.set('search', search.trim());
    const query = params.toString();

    const response = await fetch(`${API_BASE_URL}/contacts/companies${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    return parseResponse<CompanyListItem[]>(response);
  },

  async createCompany(payload: CompanyPayload): Promise<CompanyListItem> {
    const response = await fetch(`${API_BASE_URL}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return parseResponse<CompanyListItem>(response);
  },

  async getContactNotes(contactId: string): Promise<ContactNote[]> {
    const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/notes`, {
      method: 'GET',
    });

    return parseResponse<ContactNote[]>(response);
  },

  async createContactNote(contactId: string, content: string, type: string): Promise<ContactNote> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content, type }),
    });

    return parseResponse<ContactNote>(response);
  },
};
