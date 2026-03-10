import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SupabaseService } from '../supabase/supabase.service';

export type AuthRequest = Request & {
  user?: {
    id: string;
    role: string;
  };
};

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly supabaseService: SupabaseService) {}

  async use(req: AuthRequest, res: Response, next: NextFunction) {
    const userId = req.headers['x-user-id'] as string;

    if (userId) {
      try {
        // Fetch user profile from Supabase to get role
        const client = this.supabaseService.getClient();
        const { data, error } = await client
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          req.user = {
            id: userId,
            role: data.role || 'user',
          };
        }
      } catch {
        // Continue request flow: route handlers will return a typed config error if needed.
      }
    }

    next();
  }
}
