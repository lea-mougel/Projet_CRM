import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { AuthRequest } from '../auth/auth.middleware';
import { CommunicationsService } from './communications.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { SendCommunicationDto } from './dto/send-communication.dto';
import { UpdateAutomationSettingsDto } from './dto/update-automation-settings.dto';
import { UpdateCommunicationStatusDto } from './dto/update-communication-status.dto';

@Controller('communications')
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.communicationsService.findAll(req.user);
  }

  @Post()
  create(@Body() createCommunicationDto: CreateCommunicationDto, @Req() req: AuthRequest) {
    return this.communicationsService.create(createCommunicationDto, req.user);
  }

  @Post('send')
  send(@Body() sendCommunicationDto: SendCommunicationDto, @Req() req: AuthRequest) {
    return this.communicationsService.send(sendCommunicationDto, req.user);
  }

  @Get('automation-settings')
  getAutomationSettings() {
    return this.communicationsService.getAutomationSettings();
  }

  @Patch('automation-settings')
  updateAutomationSettings(@Body() dto: UpdateAutomationSettingsDto, @Req() req: AuthRequest) {
    if (!req.user || req.user.role !== 'admin') {
      throw new ForbiddenException('Seuls les admins peuvent modifier ce paramètre');
    }
    return this.communicationsService.updateAutomationSettings(dto, req.user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateCommunicationStatusDto: UpdateCommunicationStatusDto,
    @Req() req: AuthRequest,
  ) {
    return this.communicationsService.updateStatus(id, updateCommunicationStatusDto, req.user);
  }
}
