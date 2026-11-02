import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateCenterDto } from './dto/create-center.dto.js';
import type { UpdateCenterDto } from './dto/update-center.dto.js';

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

@Injectable()
export class CentersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.inspectionCenter.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const center = await this.prisma.inspectionCenter.findUnique({
      where: { id },
    });
    if (!center) {
      throw new NotFoundException('Inspection center not found');
    }
    return center;
  }

  async create(dto: CreateCenterDto) {
    const name = dto.name;
    const baseSlug = slugify(name) || 'center';
    let slug = baseSlug;
    let attempt = 0;

    while (attempt < 8) {
      try {
        return await this.prisma.inspectionCenter.create({
          data: {
            name,
            slug,
            phoneNumber: dto.phoneNumber ?? null,
            address: dto.address ?? null,
            locationArea: dto.locationArea ?? null,
            zone: dto.zone ?? null,
            state: dto.state ?? null,
            verified: dto.verified ?? false,
            country: dto.country?.trim() || 'Nigeria',
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          attempt += 1;
          slug = `${baseSlug}-${attempt + 1}`;
          continue;
        }
        throw error;
      }
    }

    throw new ConflictException('Could not allocate a unique slug');
  }

  async update(id: string, dto: UpdateCenterDto) {
    await this.findOne(id);

    return this.prisma.inspectionCenter.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phoneNumber !== undefined
          ? { phoneNumber: dto.phoneNumber }
          : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.locationArea !== undefined
          ? { locationArea: dto.locationArea }
          : {}),
        ...(dto.zone !== undefined ? { zone: dto.zone } : {}),
        ...(dto.state !== undefined ? { state: dto.state } : {}),
        ...(dto.verified !== undefined ? { verified: dto.verified } : {}),
        ...(dto.country !== undefined
          ? { country: dto.country.trim() || 'Nigeria' }
          : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.inspectionCenter.delete({ where: { id } });
    return { ok: true };
  }
}
