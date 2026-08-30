import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  const corsOrigins = configService.get<string[]>('cors.origin') || ['*'];

  // Global Prefix
  app.setGlobalPrefix(apiPrefix);

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  // CORS
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Disaster Relief Supply Chain Intelligence Platform API')
    .setDescription(
      'Production-grade RESTful API and WebSocket engine for disaster logistics, warehouse inventory, supply swaps, dynamic routing, and convoy dispatch.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Health', 'Health monitoring')
    .addTag('Authentication', 'JWT login, token refresh, and identity')
    .addTag('Dashboard', 'Operational summary and metrics')
    .addTag('Warehouses', 'Warehouse facilities and capacities')
    .addTag('Inventory', 'ACID-safe inventory and stock transactions')
    .addTag('Shelters', 'Shelter requirements, population, and isolation metrics')
    .addTag('Supply Swaps', 'Inter-warehouse supply rebalancing and explainable matching')
    .addTag('Hazards', 'Dynamic disaster hazard observations and verifications')
    .addTag('Routes', 'Hazard cost graph routing and reachability analysis')
    .addTag('Vehicles', 'Fleet assets and cold-chain compliance')
    .addTag('Convoys', 'Fleet dispatch, tracking, rerouting, and delivery')
    .addTag('Alerts', 'Disaster alerts and emergency acknowledgments')
    .addTag('Settings', 'User preferences and settings')
    .addTag('Audit', 'Immutable audit logs')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Disaster Relief API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`🚀 Disaster Relief Backend running on http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
