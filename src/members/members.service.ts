import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import { MechanicsService } from '../mechanics/mechanics.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateMemberDto } from './dto/member.schema.js';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mechanicsService: MechanicsService,
  ) {}

  private requirePrimaryCenterId(user: AuthUser): string {
    const centerIds = user.memberships
      .filter((m) => m.roleName === 'inspector' && m.centerId)
      .map((m) => m.centerId as string);
    if (centerIds.length === 0) {
      throw new ForbiddenException(
        'Inspector is not assigned to an inspection center',
      );
    }
    return centerIds[0]!;
  }

  async findAll(user: AuthUser) {
    const centerId = this.requirePrimaryCenterId(user);
    return this.mechanicsService.findByCenter(centerId);
  }

  async create(user: AuthUser, dto: CreateMemberDto) {
    const centerId = this.requirePrimaryCenterId(user);
    return this.mechanicsService.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      centerId,
    });
  }

  async remove(user: AuthUser, membershipId: string) {
    const centerId = this.requirePrimaryCenterId(user);

    const membership = await this.prisma.membershipRole.findUnique({
      where: { id: membershipId },
      include: { role: true },
    });
    if (!membership || membership.role.name !== 'inspector') {
      throw new NotFoundException('Member membership not found');
    }
    if (membership.centerId !== centerId) {
      throw new ForbiddenException('Not allowed for this inspection center');
    }
    if (membership.profileId === user.id) {
      throw new ForbiddenException('You cannot remove yourself');
    }

    return this.mechanicsService.remove(membershipId);
  }
}
