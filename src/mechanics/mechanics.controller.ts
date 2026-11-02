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
import {
  createMechanicSchema,
  updateMechanicSchema,
  type CreateMechanicDto,
  type UpdateMechanicDto,
} from './dto/mechanic.schema.js';
import { MechanicsService } from './mechanics.service.js';

@Controller('mechanics')
@UseGuards(SupabaseJwtGuard, RolesGuard)
@Roles('admin')
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Get()
  findAll() {
    return this.mechanicsService.findAll();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createMechanicSchema)) body: CreateMechanicDto,
  ) {
    return this.mechanicsService.create(body);
  }

  @Patch(':membershipId')
  update(
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body(new ZodValidationPipe(updateMechanicSchema)) body: UpdateMechanicDto,
  ) {
    return this.mechanicsService.update(membershipId, body);
  }

  @Delete(':membershipId')
  remove(@Param('membershipId', ParseUUIDPipe) membershipId: string) {
    return this.mechanicsService.remove(membershipId);
  }
}
