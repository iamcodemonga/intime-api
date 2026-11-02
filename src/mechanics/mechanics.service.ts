import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseAdminService } from '../supabase/supabase-admin.service.js';
import type { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import type { UpdateMechanicDto } from './dto/update-mechanic.dto.js';

type MechanicRow = {
  id: string;
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  center_id: string | null;
  center_name: string | null;
  created_at: Date;
};

@Injectable()
export class MechanicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  private mapMechanicRows(rows: MechanicRow[]) {
    return rows.map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      center: row.center_id
        ? { id: row.center_id, name: row.center_name ?? '' }
        : null,
      createdAt: row.created_at,
    }));
  }

  async findAll() {
    const rows = await this.prisma.$queryRaw<MechanicRow[]>(Prisma.sql`
      SELECT
        mr.id,
        mr.profile_id,
        p.first_name,
        p.last_name,
        u.email::text AS email,
        c.id AS center_id,
        c.name AS center_name,
        mr.created_at
      FROM public.membership_roles mr
      JOIN public.system_roles r ON r.id = mr.role_id
      JOIN public.profiles p ON p.id = mr.profile_id
      LEFT JOIN public.inspection_centers c ON c.id = mr.center_id
      LEFT JOIN auth.users u ON u.id = p.id
      WHERE r.name = 'inspector'
      ORDER BY mr.created_at DESC
    `);

    return this.mapMechanicRows(rows);
  }

  async findByCenter(centerId: string) {
    const rows = await this.prisma.$queryRaw<MechanicRow[]>(Prisma.sql`
      SELECT
        mr.id,
        mr.profile_id,
        p.first_name,
        p.last_name,
        u.email::text AS email,
        c.id AS center_id,
        c.name AS center_name,
        mr.created_at
      FROM public.membership_roles mr
      JOIN public.system_roles r ON r.id = mr.role_id
      JOIN public.profiles p ON p.id = mr.profile_id
      LEFT JOIN public.inspection_centers c ON c.id = mr.center_id
      LEFT JOIN auth.users u ON u.id = p.id
      WHERE r.name = 'inspector'
        AND mr.center_id = ${centerId}::uuid
      ORDER BY mr.created_at DESC
    `);

    return this.mapMechanicRows(rows);
  }

  async create(dto: CreateMechanicDto) {
    const email = dto.email.trim().toLowerCase();
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const centerId = dto.centerId;

    const center = await this.prisma.inspectionCenter.findUnique({
      where: { id: centerId },
    });
    if (!center) {
      throw new NotFoundException('Inspection center not found');
    }

    const inspectorRole = await this.prisma.systemRole.findUnique({
      where: { name: 'inspector' },
    });
    if (!inspectorRole) {
      throw new BadRequestException('Inspector role is not seeded');
    }

    const frontendUrl =
      process.env.FRONTEND_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

    let userId: string | null = null;

    const admin = this.supabaseAdmin.getClient();
    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: { first_name: firstName, last_name: lastName },
        redirectTo: `${frontendUrl}/login`,
      });

    if (inviteError) {
      const message = inviteError.message.toLowerCase();
      const alreadyExists =
        message.includes('already') ||
        message.includes('registered') ||
        message.includes('exists');

      if (!alreadyExists) {
        throw new BadRequestException(inviteError.message);
      }

      const { data: listed, error: listError } =
        await admin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
      if (listError) {
        throw new BadRequestException(listError.message);
      }
      const existing = listed.users.find(
        (u) => u.email?.toLowerCase() === email,
      );
      if (!existing) {
        throw new BadRequestException(
          'User already exists but could not be resolved by email',
        );
      }
      userId = existing.id;
    } else {
      userId = invited.user?.id ?? null;
    }

    if (!userId) {
      throw new BadRequestException('Failed to resolve invited user id');
    }

    await this.prisma.profile.upsert({
      where: { id: userId },
      create: {
        id: userId,
        firstName,
        lastName,
      },
      update: {
        firstName,
        lastName,
      },
    });

    const existingMembership = await this.prisma.membershipRole.findFirst({
      where: {
        profileId: userId,
        roleId: inspectorRole.id,
        centerId,
      },
    });
    if (existingMembership) {
      throw new ConflictException(
        'This mechanic is already assigned to that inspection center',
      );
    }

    const membership = await this.prisma.membershipRole.create({
      data: {
        profileId: userId,
        roleId: inspectorRole.id,
        centerId,
      },
      include: {
        profile: true,
        center: true,
      },
    });

    return {
      id: membership.id,
      profileId: membership.profileId,
      firstName: membership.profile.firstName,
      lastName: membership.profile.lastName,
      email,
      center: membership.center
        ? { id: membership.center.id, name: membership.center.name }
        : null,
      createdAt: membership.createdAt,
    };
  }

  async update(membershipId: string, dto: UpdateMechanicDto) {
    const membership = await this.prisma.membershipRole.findUnique({
      where: { id: membershipId },
      include: { role: true, profile: true, center: true },
    });
    if (!membership || membership.role.name !== 'inspector') {
      throw new NotFoundException('Mechanic membership not found');
    }

    if (dto.centerId !== undefined) {
      const center = await this.prisma.inspectionCenter.findUnique({
        where: { id: dto.centerId },
      });
      if (!center) {
        throw new NotFoundException('Inspection center not found');
      }
    }

    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      await this.prisma.profile.update({
        where: { id: membership.profileId },
        data: {
          ...(dto.firstName !== undefined
            ? { firstName: dto.firstName.trim() || null }
            : {}),
          ...(dto.lastName !== undefined
            ? { lastName: dto.lastName.trim() || null }
            : {}),
        },
      });
    }

    const updated = await this.prisma.membershipRole.update({
      where: { id: membershipId },
      data: {
        ...(dto.centerId !== undefined ? { centerId: dto.centerId } : {}),
      },
      include: {
        profile: true,
        center: true,
      },
    });

    const emailRows = await this.prisma.$queryRaw<{ email: string | null }[]>(
      Prisma.sql`SELECT email::text AS email FROM auth.users WHERE id = ${updated.profileId}::uuid LIMIT 1`,
    );

    return {
      id: updated.id,
      profileId: updated.profileId,
      firstName: updated.profile.firstName,
      lastName: updated.profile.lastName,
      email: emailRows[0]?.email ?? null,
      center: updated.center
        ? { id: updated.center.id, name: updated.center.name }
        : null,
      createdAt: updated.createdAt,
    };
  }

  async remove(membershipId: string) {
    const membership = await this.prisma.membershipRole.findUnique({
      where: { id: membershipId },
      include: { role: true },
    });
    if (!membership || membership.role.name !== 'inspector') {
      throw new NotFoundException('Mechanic membership not found');
    }

    await this.prisma.membershipRole.delete({ where: { id: membershipId } });
    return { ok: true };
  }
}
