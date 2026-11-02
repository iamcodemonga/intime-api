import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { RolesGuard } from './guards/roles.guard.js';
import { SupabaseJwtGuard } from './guards/supabase-jwt.guard.js';

@Module({
  controllers: [AuthController],
  providers: [SupabaseJwtGuard, RolesGuard],
  exports: [SupabaseJwtGuard, RolesGuard],
})
export class AuthModule {}
