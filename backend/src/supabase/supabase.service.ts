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
      throw new Error(
        'Missing Supabase environment variables. Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY).',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseServerKey);
  }

  getClient() {
    return this.supabase;
  }
}