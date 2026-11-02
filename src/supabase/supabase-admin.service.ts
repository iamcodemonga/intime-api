import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAdminService {
  private client: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  getClient(): SupabaseClient {
    if (this.client) return this.client;

    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = this.config
      .get<string>('SUPABASE_SERVICE_ROLE_KEY')
      ?.trim();
    if (!serviceRoleKey) {
      throw new BadRequestException(
        'SUPABASE_SERVICE_ROLE_KEY is not set in api/.env',
      );
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return this.client;
  }
}
