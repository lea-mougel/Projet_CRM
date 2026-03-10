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
  leads?: Array<{
    id: string;
    title: string;
    status: string;
    estimated_value: number;
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

export type Lead = {
  id: string;
  title: string;
  estimated_value?: number;
  status: 'nouveau' | 'en cours' | 'converti' | 'perdu';
  company_id?: string | null;
  contact_id?: string | null;
  source?: string | null;
  description?: string | null;
  assigned_to?: string | null;
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  companies?: {
    id: string;
    name: string;
    industry?: string;
  } | null;
  assigned_commercial?: {
    id?: string;
    email?: string;
  } | null;
};

export type CreateLeadPayload = {
  title: string;
  estimated_value?: number;
  status?: 'nouveau' | 'en cours' | 'converti' | 'perdu';
  company_id?: string | null;
  contact_id?: string | null;
  source?: string | null;
  description?: string | null;
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

export type Task = {
  id: string;
  title: string;
  due_date?: string | null;
  is_completed: boolean;
  contact_id?: string | null;
  lead_id?: string | null;
  user_id?: string | null;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  lead?: {
    id: string;
    title: string;
    status: 'nouveau' | 'en cours' | 'converti' | 'perdu';
  } | null;
};

export type TaskPayload = {
  title: string;
  due_date?: string;
  contact_id?: string;
  lead_id?: string;
};

export type Communication = {
  id: string;
  recipient_email: string;
  subject: string;
  body?: string | null;
  status: 'pending' | 'sent' | 'failed';
  channel: 'email';
  trigger_type: 'manual' | 'automation';
  template_key?: string | null;
  provider_message_id?: string | null;
  error_message?: string | null;
  created_at: string;
  sent_at?: string | null;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  lead?: {
    id: string;
    title: string;
    status: 'nouveau' | 'en cours' | 'converti' | 'perdu';
  } | null;
};

export type AutomationSettings = {
  enabled: boolean;
  subject: string;
  body: string;
  cooldown_hours: number;
  daily_limit_per_recipient: number;
  target: 'contact' | 'commercial';
  target_commercial_id: string | null;
  target_lead_id: string | null;
};

export type SendCommunicationPayload = {
  recipient_email: string;
  subject: string;
  body?: string;
  contact_id?: string;
  lead_id?: string;
  template_key?: string;
  trigger_type?: 'manual' | 'automation';
};

function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

  const localhostFallback = 'http://localhost:3002';
  const vercelBackendFallback = 'https://projet-crm-back.vercel.app';

  if (configured) {
    try {
      const parsed = new URL(configured);

      if (typeof window !== 'undefined') {
        const currentHost = window.location.hostname;
        const isFrontendLocalPort = parsed.hostname === currentHost && parsed.port === '3000';
        if (!isFrontendLocalPort) {
          return parsed.toString().replace(/\/$/, '');
        }
      } else if (!configured.includes('localhost:3000')) {
        return parsed.toString().replace(/\/$/, '');
      }
    } catch {
      if (configured.startsWith('http://') || configured.startsWith('https://')) {
        return configured.replace(/\/$/, '');
      }
    }
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:3002`;
    }

    // Safety net for Vercel when NEXT_PUBLIC_API_URL is missing in project settings.
    if (hostname.endsWith('.vercel.app')) {
      return vercelBackendFallback;
    }
  }

  return localhostFallback;
}

const API_BASE_URL = resolveApiBaseUrl();

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
  const raw = await response.text();

  if (!response.ok) {
    throw new Error(raw || `Erreur API (${response.status})`);
  }

  if (!raw.trim()) {
    return null as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    const contentType = response.headers.get('content-type') || 'inconnu';
    throw new Error(
      `Réponse API invalide (JSON attendu) - URL: ${response.url} - Content-Type: ${contentType} - Extrait: ${raw.slice(0, 120)}`,
    );
  }
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

  async update(id: string, payload: Partial<ContactPayload>): Promise<Contact> {
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
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/companies`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return parseResponse<CompanyListItem>(response);
  },

  async updateCompany(id: string, payload: CompanyPayload): Promise<CompanyListItem> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });

    return parseResponse<CompanyListItem>(response);
  },

  async deleteCompany(id: string): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'DELETE',
      headers,
    });

    return parseResponse<{ success: boolean }>(response);
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

  async getUnassignedContacts(): Promise<Contact[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/contacts?company_id=null`, {
      method: 'GET',
      headers,
    });

    return parseResponse<Contact[]>(response);
  },

  async getAllLeads(): Promise<Lead[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: 'GET',
      headers,
    });

    return parseResponse<Lead[]>(response);
  },

  async getLeadById(id: string): Promise<Lead> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
      method: 'GET',
      headers,
    });

    return parseResponse<Lead>(response);
  },

  async createLead(payload: CreateLeadPayload): Promise<Lead> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return parseResponse<Lead>(response);
  },

  async updateLead(id: string, payload: Partial<CreateLeadPayload>): Promise<Lead> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });

    return parseResponse<Lead>(response);
  },

  async deleteLead(id: string): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
      method: 'DELETE',
      headers,
    });

    return parseResponse<{ success: boolean }>(response);
  },

  async getUserProfile(userId: string): Promise<{ role: string }> {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    return data || { role: 'user' };
  },

  async getAllTasks(): Promise<Task[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'GET',
      headers,
    });

    return parseResponse<Task[]>(response);
  },

  async createTask(payload: TaskPayload): Promise<Task> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return parseResponse<Task>(response);
  },

  async updateTask(id: string, payload: Partial<TaskPayload> & { is_completed?: boolean }): Promise<Task> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });

    return parseResponse<Task>(response);
  },

  async deleteTask(id: string): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers,
    });

    return parseResponse<{ success: boolean }>(response);
  },

  async getCommunications(): Promise<Communication[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications`, {
      method: 'GET',
      headers,
    });

    return parseResponse<Communication[]>(response);
  },

  async sendCommunication(payload: SendCommunicationPayload): Promise<Communication> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return parseResponse<Communication>(response);
  },

  async getAutomationSettings(): Promise<AutomationSettings> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/automation-settings`, {
      method: 'GET',
      headers,
    });

    return parseResponse<AutomationSettings>(response);
  },

  async updateAutomationSettings(payload: Partial<AutomationSettings>): Promise<AutomationSettings> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/automation-settings`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });

    return parseResponse<AutomationSettings>(response);
  },
};
