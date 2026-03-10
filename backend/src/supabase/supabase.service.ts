import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient | null = null;
  public initError: string | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServerKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServerKey) {
      const missing = [!supabaseUrl && 'SUPABASE_URL', !supabaseServerKey && 'SUPABASE_SERVICE_ROLE_KEY']
        .filter(Boolean)
        .join(', ');
      this.initError = `Missing env vars: ${missing}`;
      console.error('[SupabaseService]', this.initError);
      return;
    }

    const isSecretKey = supabaseServerKey.startsWith('sb_secret_');
    const isJwt = supabaseServerKey.startsWith('eyJ');

    if (!isSecretKey && !isJwt) {
      this.initError =
        `Invalid SUPABASE_SERVICE_ROLE_KEY: expected server key starting with "eyJ..." or "sb_secret_...". ` +
        `Got "${supabaseServerKey.slice(0, 12)}...". ` +
        `Find the service_role key in Supabase Dashboard > Project Settings > API.`;
      console.error('[SupabaseService]', this.initError);
      return;
    }

    if (isJwt) {
      const payload = decodeJwtPayload(supabaseServerKey);
      const role = payload?.role;
      if (role && role !== 'service_role') {
        this.initError =
          `Invalid SUPABASE_SERVICE_ROLE_KEY: JWT role is "${String(role)}" (expected "service_role"). ` +
          `Do not use anon/publishable keys in backend.`;
        console.error('[SupabaseService]', this.initError);
        return;
      }
    }

    this.supabase = createClient(supabaseUrl, supabaseServerKey);
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new ServiceUnavailableException(
        this.initError ?? 'SupabaseService not initialized. Check backend env variables.',
      );
    }
    return this.supabase;
  }
}