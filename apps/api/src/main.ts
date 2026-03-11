import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { randomUUID } from 'crypto';
import { urlencoded } from 'express';

async function bootstrap() {
  enforceProductionEnv();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:3003',
      ];
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  });
  app.use(urlencoded({ extended: false }));

  app.use((req: any, res: any, next: any) => {
    const requestId = req.headers['x-request-id'] || randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    const startedAt = Date.now();
    res.on('finish', () => {
      console.log(
        JSON.stringify({
          level: 'info',
          requestId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
          timestamp: new Date().toISOString(),
        }),
      );
    });
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Totem API')
    .setDescription('API plateforme alternance')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? process.env.API_PORT ?? 4000;
  await app.listen(port);
  console.log(`Totem API: http://localhost:${port}/api`);
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    console.log(`Swagger: http://localhost:${port}/api/docs`);
  }
}
bootstrap();

function enforceProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;
  const required = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN', 'API_URL', 'FRONTEND_URL'];
  const missing = required.filter((k) => !process.env[k] || process.env[k]?.trim() === '');
  if (missing.length > 0) {
    throw new Error(`Missing required production env vars: ${missing.join(', ')}`);
  }
  const campaignsEnabled = process.env.MESSAGING_CAMPAIGNS_ENABLED === 'true';
  if (campaignsEnabled) {
    const hasSmtp =
      !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
    const hasTwilio =
      !!process.env.TWILIO_ACCOUNT_SID &&
      !!process.env.TWILIO_AUTH_TOKEN &&
      !!process.env.TWILIO_FROM_NUMBER;
    if (!hasSmtp && !hasTwilio) {
      throw new Error(
        'MESSAGING_CAMPAIGNS_ENABLED=true but neither SMTP nor Twilio is fully configured',
      );
    }
  }
}
