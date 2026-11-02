import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CentersController } from './centers.controller.js';
import { CentersService } from './centers.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CentersController],
  providers: [CentersService],
})
export class CentersModule {}
