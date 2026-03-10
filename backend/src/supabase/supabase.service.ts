import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    // Backend must use a server key to avoid RLS-related empty datasets in production.
    const supabaseServerKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseServerKey) {
      const missing = [!supabaseUrl && 'SUPABASE_URL', !supabaseServerKey && 'SUPABASE_SERVICE_ROLE_KEY']
        .filter(Boolean)
        .join(', ');
      throw new Error(
        `Missing Supabase env vars: ${missing}. ` +
        `SUPABASE_SERVICE_ROLE_KEY must be the JWT service_role key (starts with eyJ...), ` +
        `found in Supabase Dashboard > Project Settings > API > service_role.`,
      );
    }

    if (!supabaseServerKey.startsWith('eyJ')) {
      throw new Error(
        `Invalid SUPABASE_SERVICE_ROLE_KEY: expected a JWT starting with "eyJ..." ` +
        `(found in Supabase Dashboard > Project Settings > API > service_role). ` +
        `Got a key starting with "${supabaseServerKey.slice(0, 10)}..." which looks like a Personal Access Token, not a service role key.`,
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseServerKey);
  }

  getClient() {
    return this.supabase;
  }
}