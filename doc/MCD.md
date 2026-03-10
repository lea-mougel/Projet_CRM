-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.app_settings (
  key text NOT NULL,
  value_bool boolean,
  value_text text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT app_settings_pkey PRIMARY KEY (key),
  CONSTRAINT app_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.communications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  contact_id uuid,
  lead_id uuid,
  channel text NOT NULL DEFAULT 'email'::text CHECK (channel = 'email'::text),
  trigger_type text NOT NULL DEFAULT 'manual'::text CHECK (trigger_type = ANY (ARRAY['manual'::text, 'automation'::text])),
  template_key text,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text])),
  provider_message_id text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  CONSTRAINT communications_pkey PRIMARY KEY (id),
  CONSTRAINT communications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT communications_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id),
  CONSTRAINT communications_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id)
);
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  website text,
  created_at timestamp with time zone DEFAULT now(),
  town text,
  address text,
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contact_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid,
  author_id uuid,
  content text NOT NULL,
  type text CHECK (type = ANY (ARRAY['note'::text, 'appel'::text, 'email'::text, 'réunion'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_notes_pkey PRIMARY KEY (id),
  CONSTRAINT contact_notes_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id),
  CONSTRAINT contact_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  company_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  assigned_to uuid,
  CONSTRAINT contacts_pkey PRIMARY KEY (id),
  CONSTRAINT contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT contacts_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id)
);
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid,
  status text DEFAULT 'Nouveau Lead'::text CHECK (status = ANY (ARRAY['Nouveau Lead'::text, 'Decouverte des besoins (Audit)'::text, 'Demonstration 3DEXPERIENCE'::text, 'POC (Proof of Concept)'::text, 'Negociation contractuelle'::text, 'Gagne'::text, 'Perdu'::text])),
  estimated_value numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  assigned_to uuid,
  source text,
  title text NOT NULL DEFAULT 'Sans titre'::text,
  description text,
  company_id uuid,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id),
  CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id),
  CONSTRAINT leads_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text DEFAULT 'standard'::text CHECK (role = ANY (ARRAY['admin'::text, 'commercial'::text, 'user'::text])),
  email text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  due_date timestamp with time zone,
  is_completed boolean DEFAULT false,
  contact_id uuid,
  user_id uuid,
  lead_id uuid,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id),
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT tasks_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id)
);