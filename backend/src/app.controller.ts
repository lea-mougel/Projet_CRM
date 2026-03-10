import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async health() {
    try {
      const client = this.supabaseService.getClient();
      const { error } = await client.from('profiles').select('id').limit(1);
      return {
        status: 'ok',
        supabase: error ? `error: ${error.message}` : 'connected',
        env: {
          hasUrl: !!process.env.SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasKey: !!process.env.SUPABASE_KEY,
          frontendUrl: process.env.FRONTEND_URL || '(not set)',
        },
      };
    } catch (err: unknown) {
      return { status: 'error', message: String(err) };
    }
  }
}
