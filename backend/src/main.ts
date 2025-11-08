import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';
import { PrismaService } from './database/prisma.service';
import { LoggerService } from './common/logger/logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config and logger services
  const configService = app.get(AppConfigService);
  const logger = app.get(LoggerService);
  const prismaService = app.get(PrismaService);

  // Enable shutdown hooks for Prisma
  await prismaService.enableShutdownHooks(app);

  // Enable CORS
  app.enableCors({
    origin: configService.corsOrigin,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter to format all errors
  app.useGlobalFilters(new HttpExceptionFilter());

  // API prefix - exclude health endpoint
  const apiPrefix = configService.apiPrefix;
  const apiVersion = configService.apiVersion;
  const healthEndpoint = configService.apiHealthEndpoint;
  
  // Remove leading slash from health endpoint for exclude pattern
  const healthPathForExclude = healthEndpoint.startsWith('/') 
    ? healthEndpoint.substring(1) 
    : healthEndpoint;
  
  app.setGlobalPrefix(`/${apiPrefix}/${apiVersion}`, {
    exclude: [healthPathForExclude],
  });

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Door Lock API')
    .setDescription('Backend API for door lock system with RFID, fingerprint, and keypad authentication')
    .setVersion('1.0')
    .addTag('Health', 'Health check endpoints')
    .addTag('Users', 'User management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.port;
  await app.listen(port);

  // Get base URL from config or construct from port
  let baseUrl = configService.backendBaseUrl;
  if (!baseUrl || baseUrl.trim() === '') {
    baseUrl = `http://localhost:${port}`;
  }
  
  // Ensure baseUrl doesn't end with slash
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  logger.success(
    `Application is running on: ${cleanBaseUrl}/${apiPrefix}/${apiVersion}`,
    'Bootstrap',
  );
  logger.info(`Environment: ${configService.nodeEnv}`, 'Bootstrap');
  logger.info(`Backend Base URL: ${cleanBaseUrl}`, 'Bootstrap');
  
  // Ensure health endpoint has leading slash for display
  const healthPathForDisplay = healthEndpoint.startsWith('/') 
    ? healthEndpoint 
    : `/${healthEndpoint}`;
  
  logger.info(
    `Health endpoint available at: ${cleanBaseUrl}${healthPathForDisplay}`,
    'Bootstrap',
  );
  logger.info(
    `Swagger documentation available at: ${cleanBaseUrl}/api-docs`,
    'Bootstrap',
  );
}
bootstrap();
