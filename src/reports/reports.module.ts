import { Module } from '@nestjs/common';
import { InspectionReportService } from './inspection-report.service.js';
import { PdfRenderer } from './pdf.renderer.js';
import { ReportHtmlRenderer } from './report-html.renderer.js';

@Module({
  providers: [ReportHtmlRenderer, PdfRenderer, InspectionReportService],
  exports: [InspectionReportService],
})
export class ReportsModule {}
