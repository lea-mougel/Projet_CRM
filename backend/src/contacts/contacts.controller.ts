import { Controller, Get, Post, Patch, Delete, Body, Query, Req, Param } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import type { AuthRequest } from '../auth/auth.middleware';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // Adapté pour accepter la recherche et les infos utilisateur
  @Get()
  async findAll(
    @Query('search') search: string,
    @Query('includeAll') includeAll: string,
    @Req() req: AuthRequest,
  ) {
    // req.user est rempli par ton middleware d'authentification
    return await this.contactsService.findAll(search, req.user, includeAll === 'true');
  }

  @Get('companies')
  async findCompanies(@Query('search') search: string) {
    return await this.contactsService.findCompanies(search);
  }

  @Get('companies/:companyId')
  async findCompanyDetails(
    @Param('companyId') companyId: string,
    @Query('includeAll') includeAll: string,
    @Req() req: AuthRequest,
  ) {
    return await this.contactsService.findCompanyDetails(companyId, req.user, includeAll === 'true');
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('includeAll') includeAll: string, @Req() req: AuthRequest) {
    return await this.contactsService.findOne(id, req.user, includeAll === 'true');
  }

  @Post()
  async create(@Body() contactData: any) {
    return await this.contactsService.create(contactData);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() contactData: any) {
    return await this.contactsService.update(id, contactData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.contactsService.remove(id);
  }

  @Get(':id/notes')
  async getContactNotes(@Param('id') id: string) {
    return await this.contactsService.getContactNotes(id);
  }

  @Post(':id/notes')
  async createContactNote(
    @Param('id') id: string,
    @Body() noteData: { content: string; type: string },
    @Req() req: AuthRequest,
  ) {
    return await this.contactsService.createContactNote(id, noteData.content, noteData.type, req.user?.id);
  }
}