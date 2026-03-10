import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient | null = null;
  public initError: string | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServerKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseServerKey) {
      const missing = [!supabaseUrl && 'SUPABASE_URL', !supabaseServerKey && 'SUPABASE_SERVICE_ROLE_KEY']
        .filter(Boolean)
        .join(', ');
      this.initError = `Missing env vars: ${missing}`;
      console.error('[SupabaseService]', this.initError);
      return;
    }

    if (!supabaseServerKey.startsWith('eyJ')) {
      this.initError =
        `Invalid SUPABASE_SERVICE_ROLE_KEY: expected JWT starting with "eyJ...". ` +
        `Got "${supabaseServerKey.slice(0, 12)}...". ` +
        `Find the service_role key in Supabase Dashboard > Project Settings > API.`;
      console.error('[SupabaseService]', this.initError);
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseServerKey);
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error(this.initError ?? 'SupabaseService not initialized');
    }
    return this.supabase;
  }
}