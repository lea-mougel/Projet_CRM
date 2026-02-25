import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ContactsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const client = this.supabaseService.getClient();

    // On récupère les contacts et on joint la table profiles via assigned_to
    // On l'appelle "assigned_commercial" pour que le frontend s'y retrouve
    const { data, error } = await client
      .from('contacts')
      .select(`
        *,
        assigned_commercial:profiles!assigned_to (
          email
        )
      `);

    if (error) {
      console.error("❌ Erreur Supabase Contacts:", error.message);
      return [];
    }

    return data || [];
  }
}