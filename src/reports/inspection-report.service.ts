import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseAdminService } from '../supabase/supabase-admin.service.js';
import {
  INSPECTION_PHOTOS_BUCKET,
  PHOTO_SLOT_KEYS,
  type PhotoSlotKey,
} from '../inspections/inspection-fields.js';
import { PdfRenderer } from './pdf.renderer.js';
import { ReportHtmlRenderer } from './report-html.renderer.js';
import { buildFleetComfortReportViewModel } from './report-view-model.js';

export type GeneratedInspectionReport = {
  buffer: Buffer;
  storagePath: string;
  filename: string;
};

@Injectable()
export class InspectionReportService {
  private readonly logger = new Logger(InspectionReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAdmin: SupabaseAdminService,
    private readonly htmlRenderer: ReportHtmlRenderer,
    private readonly pdfRenderer: PdfRenderer,
  ) {}

  private reportStoragePath(centerId: string, inspectionId: string): string {
    return `centers/${centerId}/inspection/${inspectionId}/report.pdf`;
  }

  private safeFilename(vehicleNumber: string): string {
    const safe = vehicleNumber.replace(/[^\w.-]+/g, '_').replace(/_+/g, '_');
    return `${safe || 'inspection'}-Inspection_Report.pdf`;
  }

  private async loadInspection(inspectionId: string) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        photos: true,
        center: true,
        createdBy: true,
      },
    });
    if (!inspection) {
      throw new NotFoundException('Inspection not found');
    }
    return inspection;
  }

  private async downloadPhotoDataUrls(
    photos: { slotKey: string; storagePath: string; mimeType: string }[],
  ): Promise<Partial<Record<PhotoSlotKey, string>>> {
    const admin = this.supabaseAdmin.getClient();
    const bySlot = new Map(photos.map((photo) => [photo.slotKey, photo]));
    const result: Partial<Record<PhotoSlotKey, string>> = {};

    await Promise.all(
      PHOTO_SLOT_KEYS.map(async (slotKey) => {
        const photo = bySlot.get(slotKey);
        if (!photo) return;
        const { data, error } = await admin.storage
          .from(INSPECTION_PHOTOS_BUCKET)
          .download(photo.storagePath);
        if (error || !data) {
          this.logger.warn(
            `Failed to download photo ${slotKey}: ${error?.message ?? 'missing data'}`,
          );
          return;
        }
        const bytes = Buffer.from(await data.arrayBuffer());
        const mime = photo.mimeType || 'image/jpeg';
        result[slotKey] = `data:${mime};base64,${bytes.toString('base64')}`;
      }),
    );

    return result;
  }

  async generatePdfBuffer(inspectionId: string): Promise<Buffer> {
    const inspection = await this.loadInspection(inspectionId);
    const photoDataUrls = await this.downloadPhotoDataUrls(inspection.photos);
    const viewModel = buildFleetComfortReportViewModel(
      inspection,
      photoDataUrls,
    );
    const html = this.htmlRenderer.render(viewModel);
    return this.pdfRenderer.htmlToPdf(html);
  }

  async generateAndStore(
    inspectionId: string,
  ): Promise<GeneratedInspectionReport> {
    const inspection = await this.loadInspection(inspectionId);
    const photoDataUrls = await this.downloadPhotoDataUrls(inspection.photos);
    const viewModel = buildFleetComfortReportViewModel(
      inspection,
      photoDataUrls,
    );
    const html = this.htmlRenderer.render(viewModel);
    const buffer = await this.pdfRenderer.htmlToPdf(html);
    const storagePath = this.reportStoragePath(
      inspection.centerId,
      inspection.id,
    );

    const admin = this.supabaseAdmin.getClient();
    const { error } = await admin.storage
      .from(INSPECTION_PHOTOS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      throw new Error(`Report upload failed: ${error.message}`);
    }

    await this.prisma.inspection.update({
      where: { id: inspection.id },
      data: { reportStoragePath: storagePath },
    });

    return {
      buffer,
      storagePath,
      filename: this.safeFilename(inspection.vehicleNumber),
    };
  }

  async getOrCreateReportPdf(
    inspectionId: string,
  ): Promise<GeneratedInspectionReport> {
    const inspection = await this.loadInspection(inspectionId);
    const filename = this.safeFilename(inspection.vehicleNumber);

    if (inspection.reportStoragePath) {
      const admin = this.supabaseAdmin.getClient();
      const { data, error } = await admin.storage
        .from(INSPECTION_PHOTOS_BUCKET)
        .download(inspection.reportStoragePath);
      if (!error && data) {
        return {
          buffer: Buffer.from(await data.arrayBuffer()),
          storagePath: inspection.reportStoragePath,
          filename,
        };
      }
      this.logger.warn(
        `Stored report missing for ${inspectionId}; regenerating (${error?.message ?? 'empty'})`,
      );
    }

    return this.generateAndStore(inspectionId);
  }
}
