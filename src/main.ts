import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);
  console.log('JWT_SECRET:', config.get<string>('jwt.secret'));
  const jwtSecret = config.get<string>('jwt.secret');
  if (
    !jwtSecret ||
    jwtSecret.length < 32
  ) {
    throw new Error(
      'JWT_SECRET must be configured with a strong secret of at least 32 characters',
    );
  }
  app.use(helmet());
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? false });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Chat Backend API')
    .setDescription('REST chat backend with PostgreSQL and Firestore')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Chat backend listening on http://localhost:${port}/api/v1`);
  console.log(`Swagger available at http://localhost:${port}/docs`);
}
void bootstrap();
