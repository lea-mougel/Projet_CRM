import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import type { AuthRequest } from '../auth/auth.middleware';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.leadsService.findAll(req.user);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.leadsService.findById(id);
  }

  @Post()
  create(@Body() createLeadDto: CreateLeadDto, @Req() req: AuthRequest) {
    return this.leadsService.create(createLeadDto, req.user?.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto, @Req() req: AuthRequest) {
    return this.leadsService.update(id, updateLeadDto, req.user);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.leadsService.delete(id);
  }
}
