import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // On ajoute '!' à la fin des variables d'environnement
    this.supabase = createClient(
      process.env.SUPABASE_URL!, 
      process.env.SUPABASE_KEY!
    );
  }

  getClient() {
    return this.supabase;
  }
}