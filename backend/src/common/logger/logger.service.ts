import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  SUCCESS = 'success',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

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
      
      // Get the actual log level (handle custom levels)
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
        case 'http':
          levelStr = chalk.blueBright.bold('HTTP');
          break;
        case 'database':
          levelStr = chalk.cyanBright.bold('DATABASE');
          break;
        case 'api':
          levelStr = chalk.blueBright.bold('API');
          break;
        case 'security':
          levelStr = chalk.redBright.bold('SECURITY');
          break;
        case 'performance':
          levelStr = chalk.yellowBright.bold('PERFORMANCE');
          break;
        default:
          levelStr = chalk.white.bold(normalizedLevel.toUpperCase());
      }

      // Extract additional metadata
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
      defaultMeta: { service: 'door-lock-api' },
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

  // Additional utility methods
  http(message: string, context?: string): void {
    this.logger.info(message, { customLevel: 'http', context: context || this.context });
  }

  database(message: string, context?: string): void {
    this.logger.info(message, { customLevel: 'database', context: context || this.context });
  }

  api(message: string, context?: string): void {
    this.logger.info(message, { customLevel: 'api', context: context || this.context });
  }

  security(message: string, context?: string): void {
    this.logger.warn(message, { customLevel: 'security', context: context || this.context });
  }

  performance(message: string, duration?: number, context?: string): void {
    const perfMessage = duration ? `${message} (${duration}ms)` : message;
    this.logger.info(perfMessage, { 
      customLevel: 'performance',
      duration,
      context: context || this.context 
    });
  }
}
