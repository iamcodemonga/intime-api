import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { EmailService } from '../email/email.service.js';
import { InspectionReportService } from '../reports/inspection-report.service.js';
import { SupabaseAdminService } from '../supabase/supabase-admin.service.js';
import type {
  CreateInspectionDto,
  PhotoSlotKey,
} from './dto/inspection.schema.js';
import {
  ALLOWED_PHOTO_MIME,
  CHECK_FIELD_IDS,
  DEFAULT_PASS_MARK,
  INSPECTION_PHOTOS_BUCKET,
  MAX_PHOTO_BYTES,
  REQUIRED_PHOTO_COUNT,
} from './inspection-fields.js';

@Injectable()
export class InspectionsService {
  private readonly logger = new Logger(InspectionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAdmin: SupabaseAdminService,
    private readonly emailService: EmailService,
    private readonly inspectionReportService: InspectionReportService,
  ) {}

  private isAdmin(user: AuthUser): boolean {
    return user.roles.includes('admin');
  }

  private centerIdsForInspector(user: AuthUser): string[] {
    return user.memberships
      .filter((m) => m.roleName === 'inspector' && m.centerId)
      .map((m) => m.centerId as string);
  }

  private requirePrimaryCenterId(user: AuthUser): string {
    const centerIds = this.centerIdsForInspector(user);
    if (centerIds.length === 0) {
      throw new ForbiddenException(
        'Inspector is not assigned to an inspection center',
      );
    }
    return centerIds[0]!;
  }

  private assertCenterAccess(user: AuthUser, centerId: string) {
    if (this.isAdmin(user)) return;
    const centerIds = this.centerIdsForInspector(user);
    if (!centerIds.includes(centerId)) {
      throw new ForbiddenException('Not allowed for this inspection center');
    }
  }

  private listInclude = {
    center: { select: { id: true, name: true } },
    photos: {
      select: { id: true, slotKey: true, storagePath: true, mimeType: true },
    },
  } as const;

  private scoreChecks(checks: CreateInspectionDto['checks']) {
    let checksPassed = 0;
    let checksFailed = 0;
    for (const id of CHECK_FIELD_IDS) {
      if (checks[id] === 'pass') checksPassed += 1;
      else checksFailed += 1;
    }
    const total = checksPassed + checksFailed;
    const compositeScore =
      total === 0 ? 0 : Math.round((100 * checksPassed) / total);
    return { checksPassed, checksFailed, compositeScore };
  }

  private mimeToExt(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/heic':
        return 'heic';
      case 'image/heif':
        return 'heif';
      default:
        return 'bin';
    }
  }

  async create(user: AuthUser, dto: CreateInspectionDto) {
    const centerId = this.requirePrimaryCenterId(user);
    const { checksPassed, checksFailed, compositeScore } = this.scoreChecks(
      dto.checks,
    );

    return this.prisma.inspection.create({
      data: {
        centerId,
        createdById: user.id,
        vehicleNumber: dto.vehicleNumber,
        mileageKm: dto.mileageKm,
        year: dto.year,
        make: dto.make,
        model: dto.model,
        exteriorColour: dto.exteriorColour,
        engineNumber: dto.engineNumber,
        chassisNumber: dto.chassisNumber,
        driverFirstName: dto.driverFirstName,
        driverLastName: dto.driverLastName,
        phoneNumber: dto.phoneNumber,
        emailAddress: dto.emailAddress,
        checks: dto.checks as Prisma.InputJsonValue,
        grades: dto.grades as Prisma.InputJsonValue,
        checksPassed,
        checksFailed,
        photosCaptured: 0,
        passMark: DEFAULT_PASS_MARK,
        compositeScore,
        status: 'draft',
      },
      include: { photos: true },
    });
  }

  async findAll(user: AuthUser) {
    if (this.isAdmin(user)) {
      return this.prisma.inspection.findMany({
        orderBy: { createdAt: 'desc' },
        include: this.listInclude,
      });
    }

    const centerIds = this.centerIdsForInspector(user);
    if (centerIds.length === 0) return [];

    return this.prisma.inspection.findMany({
      where: { centerId: { in: centerIds } },
      orderBy: { createdAt: 'desc' },
      include: this.listInclude,
    });
  }

  async findOne(user: AuthUser, id: string) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: {
        center: { select: { id: true, name: true } },
        photos: true,
      },
    });
    if (!inspection) {
      throw new NotFoundException('Inspection not found');
    }
    this.assertCenterAccess(user, inspection.centerId);
    return inspection;
  }

  async uploadPhoto(
    user: AuthUser,
    inspectionId: string,
    slotKey: PhotoSlotKey,
    file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    if (!ALLOWED_PHOTO_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported image type: ${file.mimetype}`,
      );
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new BadRequestException(
        `File too large (max ${MAX_PHOTO_BYTES} bytes)`,
      );
    }

    const inspection = await this.findOne(user, inspectionId);
    const ext = this.mimeToExt(file.mimetype);
    const storagePath = `centers/${inspection.centerId}/inspection/${inspection.id}/photos/${slotKey}.${ext}`;

    const admin = this.supabaseAdmin.getClient();
    const { error: uploadError } = await admin.storage
      .from(INSPECTION_PHOTOS_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new BadRequestException(
        `Storage upload failed: ${uploadError.message}`,
      );
    }

    await this.prisma.inspectionPhoto.upsert({
      where: {
        inspectionId_slotKey: {
          inspectionId: inspection.id,
          slotKey,
        },
      },
      create: {
        inspectionId: inspection.id,
        slotKey,
        storagePath,
        mimeType: file.mimetype,
        byteSize: file.size,
      },
      update: {
        storagePath,
        mimeType: file.mimetype,
        byteSize: file.size,
      },
    });

    const photosCaptured = await this.prisma.inspectionPhoto.count({
      where: { inspectionId: inspection.id },
    });

    const becameCompleted =
      photosCaptured >= REQUIRED_PHOTO_COUNT &&
      inspection.status !== 'completed';

    const updated = await this.prisma.inspection.update({
      where: { id: inspection.id },
      data: {
        photosCaptured,
        status:
          photosCaptured >= REQUIRED_PHOTO_COUNT ? 'completed' : 'draft',
      },
      include: { photos: true },
    });

    let emailSent = false;
    let reportStoragePath = updated.reportStoragePath;
    if (becameCompleted) {
      let pdfAttachment:
        | { filename: string; content: Buffer }
        | undefined;

      try {
        const report = await this.inspectionReportService.generateAndStore(
          updated.id,
        );
        reportStoragePath = report.storagePath;
        pdfAttachment = {
          filename: report.filename,
          content: report.buffer,
        };
      } catch (error) {
        this.logger.error('Inspection PDF report generation failed', error);
      }

      try {
        emailSent = await this.emailService.sendInspectionCompleted({
          to: updated.emailAddress,
          driverFirstName: updated.driverFirstName,
          driverLastName: updated.driverLastName,
          vehicleNumber: updated.vehicleNumber,
          make: updated.make,
          model: updated.model,
          year: updated.year,
          compositeScore: updated.compositeScore,
          passMark: updated.passMark,
          checksPassed: updated.checksPassed,
          checksFailed: updated.checksFailed,
          pdfAttachment,
        });
      } catch (error) {
        // Inspection is already saved; email must not fail the upload response.
        this.logger.error('Inspection completion email failed', error);
      }
    }

    return { ...updated, reportStoragePath, emailSent };
  }

  async getReportPdf(user: AuthUser, id: string) {
    await this.findOne(user, id);
    return this.inspectionReportService.getOrCreateReportPdf(id);
  }

  async resendReport(user: AuthUser, id: string) {
    const inspection = await this.findOne(user, id);
    if (inspection.status !== 'completed') {
      throw new BadRequestException(
        'Report can only be resent for completed inspections',
      );
    }

    const report = await this.inspectionReportService.getOrCreateReportPdf(
      inspection.id,
    );

    const emailSent = await this.emailService.sendInspectionCompleted({
      to: inspection.emailAddress,
      driverFirstName: inspection.driverFirstName,
      driverLastName: inspection.driverLastName,
      vehicleNumber: inspection.vehicleNumber,
      make: inspection.make,
      model: inspection.model,
      year: inspection.year,
      compositeScore: inspection.compositeScore,
      passMark: inspection.passMark,
      checksPassed: inspection.checksPassed,
      checksFailed: inspection.checksFailed,
      pdfAttachment: {
        filename: report.filename,
        content: report.buffer,
      },
    });

    if (!emailSent) {
      throw new BadRequestException(
        'Failed to send inspection report email',
      );
    }

    return {
      emailSent: true,
      reportStoragePath: report.storagePath,
    };
  }
}
