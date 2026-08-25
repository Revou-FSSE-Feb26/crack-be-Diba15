import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './prisma/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie parser — untuk baca HttpOnly refresh_token cookie
  app.use(cookieParser());

  // Global prefix untuk semua route
  app.setGlobalPrefix('api');

  // CORS — izinkan request dari frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true, // Wajib agar cookie bisa dikirim cross-origin
  });

  // Global validation pipe — otomatis validasi semua DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip field yang tidak ada di DTO
      forbidNonWhitelisted: true, // Error jika ada field asing
      transform: true, // Auto-transform type (string → number, dll)
    }),
  );

  // Prisma Exception Filter global
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TruBrush API')
    .setDescription('TruBrush Backend REST API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT Access Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 TruBrush API berjalan di http://localhost:${port}/api`);
  console.log(`📑 TruBrush Swagger Docs berjalan di http://localhost:${port}/docs`);
}

bootstrap();
