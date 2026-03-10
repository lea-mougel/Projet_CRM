import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import type { AuthRequest } from '../auth/auth.middleware';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.tasksService.findAll(req.user);
  }

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: AuthRequest) {
    return this.tasksService.create(createTaskDto, req.user?.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Req() req: AuthRequest) {
    return this.tasksService.update(id, updateTaskDto, req.user);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.tasksService.delete(id, req.user);
  }
}
