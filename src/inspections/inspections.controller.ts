import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthUser } from '../auth/auth.types.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  createInspectionSchema,
  photoSlotKeySchema,
  type CreateInspectionDto,
  type PhotoSlotKey,
} from './dto/inspection.schema.js';
import { MAX_PHOTO_BYTES } from './inspection-fields.js';
import { InspectionsService } from './inspections.service.js';

@Controller('inspections')
@UseGuards(SupabaseJwtGuard, RolesGuard)
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get()
  @Roles('inspector', 'admin')
  findAll(@CurrentUser() user: AuthUser) {
    return this.inspectionsService.findAll(user);
  }

  @Get(':id/report.pdf')
  @Roles('inspector', 'admin')
  @Header('Content-Type', 'application/pdf')
  async downloadReport(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const report = await this.inspectionsService.getReportPdf(user, id);
    return new StreamableFile(report.buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${report.filename}"`,
    });
  }

  @Get(':id')
  @Roles('inspector', 'admin')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.inspectionsService.findOne(user, id);
  }

  @Post()
  @Roles('inspector')
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createInspectionSchema))
    body: CreateInspectionDto,
  ) {
    return this.inspectionsService.create(user, body);
  }

  @Post(':id/photos')
  @Roles('inspector')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PHOTO_BYTES },
    }),
  )
  uploadPhoto(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('slotKey', new ZodValidationPipe(photoSlotKeySchema))
    slotKey: PhotoSlotKey,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.inspectionsService.uploadPhoto(user, id, slotKey, file);
  }

  @Post(':id/resend-report')
  @Roles('inspector', 'admin')
  resendReport(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.inspectionsService.resendReport(user, id);
  }
}
