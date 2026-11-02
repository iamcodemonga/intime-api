import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthUser } from '../auth.types.js';

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    this.jwks = createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: { sub?: string; email?: string };
    try {
      const verified = await jwtVerify(token, this.jwks);
      payload = verified.payload as { sub?: string; email?: string };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Token missing subject');
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
            center: true,
          },
        },
      },
    });

    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    const roles = Array.from(
      new Set(profile.memberships.map((m) => m.role.name)),
    );
    const permissions = Array.from(
      new Set(
        profile.memberships.flatMap((m) =>
          m.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    );

    request.user = {
      id: profile.id,
      email: payload.email ?? null,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      roles,
      permissions,
      memberships: profile.memberships.map((m) => ({
        id: m.id,
        roleId: m.roleId,
        roleName: m.role.name,
        centerId: m.centerId,
        centerSlug: m.center?.slug ?? null,
        centerName: m.center?.name ?? null,
      })),
    };

    return true;
  }
}
