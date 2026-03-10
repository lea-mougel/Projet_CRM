import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Activation du CORS pour permettre au projet Frontend Vercel de contacter ce projet Backend
  // Dans le cadre du projet : Connexion sécurisée frontend-backend via APIs REST 
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*', // Idéalement, mettez l'URL Vercel de votre front ici
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2. Validation globale des DTOs (utile pour les modules Leads, Contacts, etc.) [cite: 231]
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 3. Utilisation du port dynamique imposé par Vercel ou 3000 par défaut
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();