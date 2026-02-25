import { Controller, Post, Body } from '@nestjs/common';
import { ContactsService } from '../contacts/contacts.service';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  async create(@Body() companyData: any) {
    return await this.contactsService.createCompany(companyData);
  }
}
