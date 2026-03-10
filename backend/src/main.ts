import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

// Node 25 can treat some deprecations as thrown errors; keep them non-fatal.
try {
  (process as any).throwDeprecation = false;
} catch {
  // Ignore read-only runtime environments.
}

const originalEmitWarning = process.emitWarning.bind(process);
process.emitWarning = ((warning: any, ...args: any[]) => {
  const message = typeof warning === 'string' ? warning : warning?.message;
  if (typeof message === 'string' && message.includes("'app.router' is deprecated")) {
    return;
  }
  return originalEmitWarning(warning, ...args);
}) as typeof process.emitWarning;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS?.split(',') || []),
  ]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));

  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      const isConfigured = configuredOrigins.includes(origin);
      const isVercelPreview = /^https:\/\/.*\.vercel\.app$/.test(origin);

      if (isLocalhost || isConfigured || isVercelPreview) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origine non autorisee par CORS: ${origin}`), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();