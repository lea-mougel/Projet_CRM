import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { SupabaseModule } from '../supabase/supabase.module'; // Vérifiez le chemin
import { CommunicationsModule } from '../communications/communications.module';

@Module({
  imports: [SupabaseModule, CommunicationsModule], // On ajoute SupabaseModule ici
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}