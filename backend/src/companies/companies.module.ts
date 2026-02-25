import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { ContactsService } from '../contacts/contacts.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [CompaniesController],
  providers: [ContactsService],
})
export class CompaniesModule {}
