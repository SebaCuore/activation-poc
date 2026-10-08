import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ActivationsService } from './activations.service';
import type { CreateActivationDto } from './activation';

@Controller('activations')
export class ActivationsController {
  constructor(private readonly activationsService: ActivationsService) {}

  @Post()
  @HttpCode(202)
  create(@Body() dto: CreateActivationDto) {
    return this.activationsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activationsService.findOne(id);
  }
}