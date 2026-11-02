import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CentersModule } from './centers/centers.module.js';
import { EmailModule } from './email/email.module.js';
import { InspectionsModule } from './inspections/inspections.module.js';
import { MechanicsModule } from './mechanics/mechanics.module.js';
import { MembersModule } from './members/members.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SupabaseAdminModule } from './supabase/supabase-admin.module.js';

const REQUIRED_ENV = ["DATABASE_URL", "SUPABASE_URL"] as const;

function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED_ENV.filter((key) => {
    const value = config[key];
    return typeof value !== "string" || value.trim().length === 0;
  });
  if (missing.length > 0) {
    throw new Error(
      `Missing required env: ${missing.join(", ")}. Set them in api/.env (see .env.example).`,
    );
  }
  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      validate: validateEnv,
    }),
    PrismaModule,
    SupabaseAdminModule,
    EmailModule,
    AuthModule,
    CentersModule,
    MechanicsModule,
    MembersModule,
    InspectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
