import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { SupabaseModule } from '../supabase/supabase.module'; // Chemin à vérifier selon ton projet

@Module({
  imports: [SupabaseModule], // Indispensable pour que le Service accède à Supabase
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService], // Optionnel, mais utile
})
export class ContactsModule {}