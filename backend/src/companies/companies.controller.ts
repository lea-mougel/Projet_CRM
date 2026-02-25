import { Controller, Post, Body, Patch, Delete, Param, Get } from '@nestjs/common';
import { ContactsService } from '../contacts/contacts.service';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.contactsService.findCompanyDetails(id, undefined, true);
  }

  @Post()
  async create(@Body() companyData: any) {
    return await this.contactsService.createCompany(companyData);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() companyData: any) {
    return await this.contactsService.updateCompany(id, companyData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.contactsService.deleteCompany(id);
  }
}
