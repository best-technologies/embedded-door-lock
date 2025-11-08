# NestJS Project Setup Guide

A comprehensive guide for setting up a professional NestJS project with all essential features.

## Table of Contents

1. [Initial Setup](#1-initial-setup)
2. [Configuration Management](#2-configuration-management)
3. [Logger Setup](#3-logger-setup)
4. [Database Setup (Prisma)](#4-database-setup-prisma)
5. [Health Check Endpoint](#5-health-check-endpoint)
6. [Swagger Documentation](#6-swagger-documentation)
7. [Keep-Alive Service (Render.com)](#7-keep-alive-service-rendercom)
8. [Project Structure](#8-project-structure)
9. [Environment Variables](#9-environment-variables)
10. [Final Checklist](#10-final-checklist)

---

## 1. Initial Setup

### Create NestJS Project

```bash
# Navigate to your project directory
cd /path/to/your/project

# Initialize NestJS project (in current directory)
npx --yes @nestjs/cli new . --package-manager npm --skip-git

# Install additional dependencies
npm install @nestjs/config class-validator class-transformer
```

### Update package.json

Update the package name and description:

```json
{
  "name": "your-project-name",
  "version": "0.0.1",
  "description": "Your project description"
}
```

---

## 2. Configuration Management

### Install Dependencies

```bash
npm install @nestjs/config
```

### Create Config Service

**File: `src/config/config.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get apiPrefix(): string {
    return this.configService.get<string>('API_PREFIX', 'api');
  }

  get apiVersion(): string {
    return this.configService.get<string>('API_VERSION', 'v1');
  }

  get corsOrigin(): string {
    return this.configService.get<string>('CORS_ORIGIN', '*');
  }

  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL', 'info');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  // Add your custom config getters here
}
```

### Create Config Module

**File: `src/config/config.module.ts`**

```typescript
import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService } from './config.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
```

### Create Index File

**File: `src/config/index.ts`**

```typescript
export { AppConfigService } from './config.service';
export { AppConfigModule } from './config.module';
```

### Update AppModule

**File: `src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
// ... other imports

@Module({
  imports: [
    AppConfigModule,
    // ... other modules
  ],
  // ...
})
export class AppModule {}
```

---

## 3. Logger Setup

### Install Dependencies

```bash
npm install winston nest-winston chalk
npm install --save-dev @types/chalk
```

### Create Logger Service

**File: `src/common/logger/logger.service.ts`**

```typescript
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor() {
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Custom format for console output with colors
    const consoleFormat = winston.format.printf((info) => {
      const timestamp = chalk.gray(`[${new Date().toISOString()}]`);
      const ctx = (info.context as string) || 'Application';
      const contextStr = chalk.cyan(`[${ctx}]`);
      
      const logLevel = (info.customLevel || info.level || 'info') as string;
      const normalizedLevel = logLevel.replace(/\u001b\[[0-9;]*m/g, '').toLowerCase();
      
      let levelStr: string;
      switch (normalizedLevel) {
        case 'error':
          levelStr = chalk.red.bold('ERROR');
          break;
        case 'warn':
          levelStr = chalk.yellow.bold('WARN');
          break;
        case 'success':
          levelStr = chalk.green.bold('SUCCESS');
          break;
        case 'info':
          levelStr = chalk.blue.bold('INFO');
          break;
        case 'debug':
          levelStr = chalk.magenta.bold('DEBUG');
          break;
        case 'verbose':
          levelStr = chalk.cyan.bold('VERBOSE');
          break;
        default:
          levelStr = chalk.white.bold(normalizedLevel.toUpperCase());
      }

      const excludeFields = ['timestamp', 'level', 'message', 'context', 'service', 'stack', 'customLevel'];
      const metaFields: any = {};
      if (info) {
        Object.keys(info).forEach((key) => {
          if (!excludeFields.includes(key) && info[key] !== undefined) {
          metaFields[key] = info[key];
        }
      });
    }

      const metaStr = Object.keys(metaFields).length > 0 
        ? chalk.gray(` ${JSON.stringify(metaFields)}`) 
        : '';

      const traceStr = info.trace ? chalk.red(`\n${info.trace}`) : '';

      return `${timestamp} ${levelStr} ${contextStr} ${info.message}${metaStr}${traceStr}`;
    });

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'your-service-name' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.splat(),
            consoleFormat,
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
    return this;
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context: context || this.context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context: context || this.context });
  }

  success(message: string, context?: string): void {
    this.logger.info(message, { customLevel: 'success', context: context || this.context });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context: context || this.context });
  }

  info(message: string, context?: string): void {
    this.logger.info(message, { context: context || this.context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context: context || this.context });
  }
}
```

### Create Logger Module

**File: `src/common/logger/logger.module.ts`**

```typescript
import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
```

### Create Index File

**File: `src/common/logger/index.ts`**

```typescript
export { LoggerService } from './logger.service';
export { LoggerModule } from './logger.module';
```

### Update AppModule

```typescript
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    // ... other modules
  ],
  // ...
})
export class AppModule {}
```

---

## 4. Database Setup (Prisma)

### Install Dependencies

```bash
npm install @prisma/client
npm install -D prisma
```

### Initialize Prisma

```bash
npx prisma init
```

### Update Prisma Schema

**File: `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add your models here
```

### Create Prisma Service

**File: `src/database/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppConfigService } from '../config/config.service';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly configService: AppConfigService,
    private readonly logger: LoggerService,
  ) {
    super({
      log: configService.isDevelopment
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.success('Database connected successfully', 'PrismaService');
    } catch (error: any) {
      this.logger.error(
        `Failed to connect to database: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'PrismaService',
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.info('Database disconnected successfully', 'PrismaService');
    } catch (error: any) {
      this.logger.error(
        `Error disconnecting from database: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'PrismaService',
      );
    }
  }

  async enableShutdownHooks(app: any) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

### Create Database Module

**File: `src/database/database.module.ts`**

```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AppConfigModule } from '../config/config.module';
import { LoggerModule } from '../common/logger/logger.module';

@Global()
@Module({
  imports: [AppConfigModule, LoggerModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

### Update package.json Scripts

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:migrate:reset": "prisma migrate reset",
    "prisma:studio": "prisma studio",
    "postinstall": "prisma generate"
  }
}
```

### Update AppModule

```typescript
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    DatabaseModule,
    // ... other modules
  ],
  // ...
})
export class AppModule {}
```

---

## 5. Health Check Endpoint

### Create Health Service

**File: `src/health/health.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async getHealth() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'unknown',
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
      health.status = 'degraded';
      this.logger.warn('Database health check failed', 'HealthService');
    }

    return health;
  }
}
```

### Create Health Controller

**File: `src/health/health.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  check() {
    return this.healthService.getHealth();
  }
}
```

### Create Health Module

**File: `src/health/health.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [DatabaseModule, LoggerModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
```

### Update AppModule

```typescript
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ...
    HealthModule,
    // ...
  ],
  // ...
})
export class AppModule {}
```

### Update main.ts to Exclude Health from API Prefix

```typescript
// In bootstrap function
const healthEndpoint = configService.apiHealthEndpoint || '/health';
const healthPathForExclude = healthEndpoint.startsWith('/') 
  ? healthEndpoint.substring(1) 
  : healthEndpoint;

app.setGlobalPrefix(`/${apiPrefix}/${apiVersion}`, {
  exclude: [healthPathForExclude],
});
```

---

## 6. Swagger Documentation

### Install Dependencies

```bash
npm install @nestjs/swagger swagger-ui-express
```

### Update main.ts

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// In bootstrap function, after setting global prefix
const swaggerConfig = new DocumentBuilder()
  .setTitle('Your API Title')
  .setDescription('Your API description')
  .setVersion('1.0')
  .addTag('Health', 'Health check endpoints')
  .build();

const document = SwaggerModule.createDocument(app, swaggerConfig);

SwaggerModule.setup('api-docs', app, document, {
  swaggerOptions: {
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  },
});
```

### Add Swagger Decorators to Controllers

```typescript
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns the health status of the application',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
  })
  check() {
    return this.healthService.getHealth();
  }
}
```

---

## 7. Keep-Alive Service (Render.com)

### Install Dependencies

```bash
npm install @nestjs/schedule
```

### Create Keep-Alive Service

**File: `src/health/keep-alive.service.ts`**

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppConfigService } from '../config/config.service';
import { LoggerService } from '../common/logger/logger.service';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class KeepAliveService implements OnModuleInit {
  constructor(
    private readonly configService: AppConfigService,
    private readonly logger: LoggerService,
  ) {}

  private getHealthUrl(): string {
    const healthEndpoint = this.configService.apiHealthEndpoint || '/health';
    let baseUrl = this.configService.backendBaseUrl;
    
    if (!baseUrl || baseUrl.trim() === '') {
      const port = this.configService.port;
      baseUrl = `http://localhost:${port}`;
    }
    
    const endpoint = healthEndpoint.startsWith('/') 
      ? healthEndpoint 
      : `/${healthEndpoint}`;
    
    const cleanBaseUrl = baseUrl.endsWith('/') 
      ? baseUrl.slice(0, -1) 
      : baseUrl;
    
    return `${cleanBaseUrl}${endpoint}`;
  }

  onModuleInit() {
    const healthUrl = this.getHealthUrl();
    this.logger.info(
      `Keep-alive service initialized. Will ping ${healthUrl} every 13 minutes`,
      'KeepAliveService',
    );
  }

  @Cron('*/13 * * * *', {
    name: 'keep-alive',
    timeZone: 'UTC',
  })
  async handleKeepAlive() {
    const healthUrl = this.getHealthUrl();

    try {
      this.logger.info(`Pinging health endpoint: ${healthUrl}`, 'KeepAliveService');

      const url = new URL(healthUrl);
      const client = url.protocol === 'https:' ? https : http;

      await new Promise<void>((resolve, reject) => {
        const req = client.get(url.toString(), (res) => {
          res.on('end', () => {
            if (res.statusCode === 200) {
              this.logger.success(
                `Health check successful: ${res.statusCode}`,
                'KeepAliveService',
              );
              resolve();
            } else {
              this.logger.warn(
                `Health check returned status: ${res.statusCode}`,
                'KeepAliveService',
              );
              resolve();
            }
          });
        });

        req.on('error', (error) => {
          this.logger.error(
            `Health check failed: ${error.message}`,
            error.stack,
            'KeepAliveService',
          );
          reject(error);
        });

        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Health check timeout'));
        });
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to ping health endpoint: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'KeepAliveService',
      );
    }
  }
}
```

### Update Health Module

```typescript
import { ScheduleModule } from '@nestjs/schedule';
import { KeepAliveService } from './keep-alive.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ... other imports
  ],
  providers: [HealthService, KeepAliveService],
  // ...
})
export class HealthModule {}
```

### Add to Config Service

```typescript
get apiHealthEndpoint(): string {
  return this.configService.get<string>('API_HEALTH_ENDPOINT', '/health');
}

get backendBaseUrl(): string {
  return this.configService.get<string>('BACKEND_BASE_URL', 'http://localhost:3000');
}
```

---

## 8. Project Structure

```
src/
├── common/
│   ├── dto/
│   ├── entities/
│   ├── helpers/
│   ├── interfaces/
│   └── logger/
│       ├── logger.service.ts
│       ├── logger.module.ts
│       └── index.ts
├── config/
│   ├── config.service.ts
│   ├── config.module.ts
│   └── index.ts
├── database/
│   ├── prisma.service.ts
│   ├── database.module.ts
│   └── index.ts
├── health/
│   ├── health.controller.ts
│   ├── health.service.ts
│   ├── health.module.ts
│   ├── keep-alive.service.ts
│   └── dto/
│       └── health-response.dto.ts
├── app.module.ts
└── main.ts
```

---

## 9. Environment Variables

**File: `.env.example`**

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# API Configuration
API_PREFIX=api
API_VERSION=v1
BACKEND_BASE_URL=http://localhost:3000

# Health Check
API_HEALTH_ENDPOINT=/health

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

---

## 10. Final Checklist

- [ ] NestJS project initialized
- [ ] Configuration module set up
- [ ] Logger service with Winston and colors
- [ ] Prisma database setup
- [ ] Health check endpoint
- [ ] Swagger documentation configured
- [ ] Keep-alive service for Render.com
- [ ] Environment variables configured
- [ ] All modules imported in AppModule
- [ ] main.ts configured with all features
- [ ] .gitignore updated (logs/, .env, etc.)
- [ ] README.md created with setup instructions

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Database setup
npm run prisma:migrate
npm run prisma:generate

# Start development server
npm run start:dev

# Access points
# API: http://localhost:3000/api/v1
# Health: http://localhost:3000/health
# Swagger: http://localhost:3000/api-docs
```

---

## Notes

- All modules are marked as `@Global()` where appropriate for easy access
- Logger automatically creates `logs/` directory
- Prisma Client is auto-generated on `npm install` via `postinstall` script
- Health endpoint is excluded from API prefix
- Keep-alive service falls back to localhost if `BACKEND_BASE_URL` is not set

---

**Last Updated:** 2025-11-08

