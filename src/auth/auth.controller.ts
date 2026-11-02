import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { AuthUser } from './auth.types.js';
import { SupabaseJwtGuard } from './guards/supabase-jwt.guard.js';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(SupabaseJwtGuard)
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
