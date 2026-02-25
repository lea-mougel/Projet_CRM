import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service'; // Ajustez le chemin selon votre projet

@Injectable()
export class LeadsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('leads')
      .select('*');

    if (error) {
      console.error("Erreur Supabase Leads:", error);
      return [];
    }

    return data; // NestJS transformera automatiquement ce tableau en JSON
  }
}