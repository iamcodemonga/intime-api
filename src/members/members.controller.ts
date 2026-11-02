import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthUser } from '../auth/auth.types.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  createMemberSchema,
  type CreateMemberDto,
} from './dto/member.schema.js';
import { MembersService } from './members.service.js';

@Controller('members')
@UseGuards(SupabaseJwtGuard, RolesGuard)
@Roles('inspector')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.membersService.findAll(user);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createMemberSchema)) body: CreateMemberDto,
  ) {
    return this.membersService.create(user, body);
  }

  @Delete(':membershipId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ) {
    return this.membersService.remove(user, membershipId);
  }
}
