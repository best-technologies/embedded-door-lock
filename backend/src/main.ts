import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';
import { PrismaService } from './database/prisma.service';
import { LoggerService } from './common/logger/logger.service';

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

  const port = configService.port;
  await app.listen(port);

  logger.success(
    `Application is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`,
    'Bootstrap',
  );
  logger.info(`Environment: ${configService.nodeEnv}`, 'Bootstrap');
  logger.info(`Backend Base URL: ${configService.backendBaseUrl}`, 'Bootstrap');
  
  // Ensure health endpoint has leading slash for display
  const healthPathForDisplay = healthEndpoint.startsWith('/') 
    ? healthEndpoint 
    : `/${healthEndpoint}`;
  
  logger.info(
    `Health endpoint available at: http://localhost:${port}${healthPathForDisplay}`,
    'Bootstrap',
  );
}
bootstrap();
