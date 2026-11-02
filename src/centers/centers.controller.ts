import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { CentersService } from './centers.service.js';
import {
  createCenterSchema,
  updateCenterSchema,
  type CreateCenterDto,
  type UpdateCenterDto,
} from './dto/center.schema.js';

@Controller('centers')
@UseGuards(SupabaseJwtGuard, RolesGuard)
@Roles('admin')
export class CentersController {
  constructor(private readonly centersService: CentersService) {}

  @Get()
  findAll() {
    return this.centersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.centersService.findOne(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createCenterSchema)) body: CreateCenterDto,
  ) {
    return this.centersService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCenterSchema)) body: UpdateCenterDto,
  ) {
    return this.centersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.centersService.remove(id);
  }
}
