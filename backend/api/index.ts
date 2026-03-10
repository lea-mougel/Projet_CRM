import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';

// Some Vercel runtimes can treat deprecation warnings as thrown errors.
// Express 5 emits an app.router deprecation warning during bootstrap.
process.throwDeprecation = false;
process.noDeprecation = true;

let cachedExpressApp: ReturnType<typeof express> | null = null;

async function bootstrap() {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS?.split(',') || []),
  ]
    .map((origin) => origin?.trim().replace(/\/$/, '')) // strip trailing slash
    .filter((origin): origin is string => Boolean(origin));

  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      // Allow server-to-server calls (no origin header)
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/$/, '');

      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin);
      const isConfigured = configuredOrigins.includes(normalizedOrigin);
      // Always allow any *.vercel.app origin (both frontend and preview deployments)
      const isVercel = /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(normalizedOrigin);

      if (isLocalhost || isConfigured || isVercel) {
        callback(null, true);
        return;
      }

      console.warn(`[CORS] Origine bloquée: ${origin} | Origines configurées: ${configuredOrigins.join(', ')}`);
      callback(null, false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.init();
  return expressApp;
}

export default async function handler(req: any, res: any) {
  try {
    if (!cachedExpressApp) {
      cachedExpressApp = await bootstrap();
    }
    return cachedExpressApp(req, res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[handler] Bootstrap error:', message);
    res.status(500).json({ status: 'bootstrap_error', message });
  }
}
