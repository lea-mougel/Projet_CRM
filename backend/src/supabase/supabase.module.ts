import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global() // Rendre ce module global simplifie les choses
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService], // TRÈS IMPORTANT : permet aux autres modules de l'utiliser
})
export class SupabaseModule {}