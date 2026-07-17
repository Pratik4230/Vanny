import { Controller, Get, Param } from '@nestjs/common';
import { FormatsService } from './formats.service';

@Controller('interview-formats')
export class FormatsController {
  constructor(private readonly formats: FormatsService) {}

  @Get()
  findAll() {
    return this.formats.findAllActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formats.findActiveById(id);
  }
}
