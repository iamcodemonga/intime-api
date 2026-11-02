import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ReportsModule } from '../reports/reports.module.js';
import { InspectionsController } from './inspections.controller.js';
import { InspectionsService } from './inspections.service.js';

@Module({
  imports: [AuthModule, ReportsModule],
  controllers: [InspectionsController],
  providers: [InspectionsService],
})
export class InspectionsModule {}
