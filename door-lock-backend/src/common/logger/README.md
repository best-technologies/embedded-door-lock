# Logger Service

Professional logging service with color-coded output and multiple log levels.

## Features

- ✅ Color-coded log levels
- ✅ File logging (error.log and combined.log)
- ✅ Context-aware logging
- ✅ Multiple log methods (error, warn, success, info, debug, verbose)
- ✅ Specialized methods (http, database, api, security, performance)
- ✅ Timestamp formatting
- ✅ Metadata support

## Usage

### Basic Usage

```typescript
import { LoggerService } from './common/logger';

// In your service/controller
constructor(private readonly logger: LoggerService) {}

// Standard methods
this.logger.error('Error message', 'stack trace', 'ContextName');
this.logger.warn('Warning message', 'ContextName');
this.logger.success('Success message', 'ContextName');
this.logger.info('Info message', 'ContextName');
this.logger.debug('Debug message', 'ContextName');
this.logger.verbose('Verbose message', 'ContextName');

// Specialized methods
this.logger.http('HTTP request logged', 'HttpInterceptor');
this.logger.database('Database query executed', 'DatabaseService');
this.logger.api('API endpoint called', 'ApiController');
this.logger.security('Security event detected', 'AuthGuard');
this.logger.performance('Operation completed', 150, 'ServiceName');
```

### With Context

```typescript
// Set context for all subsequent logs
this.logger.setContext('UserService').info('User created');

// Or pass context per log
this.logger.info('User created', 'UserService');
```

## Log Levels

| Level | Color | Usage |
|-------|-------|-------|
| ERROR | Red | Errors and exceptions |
| WARN | Yellow | Warnings |
| SUCCESS | Green | Successful operations |
| INFO | Blue | General information |
| DEBUG | Magenta | Debug information |
| VERBOSE | Cyan | Verbose details |
| HTTP | Blue Bright | HTTP requests/responses |
| DATABASE | Cyan Bright | Database operations |
| API | Blue Bright | API calls |
| SECURITY | Red Bright | Security events |
| PERFORMANCE | Yellow Bright | Performance metrics |

## Configuration

Set log level via environment variable:

```env
LOG_LEVEL=debug  # error, warn, info, debug, verbose
```

## Log Files

Logs are written to:
- `logs/error.log` - Only error level logs
- `logs/combined.log` - All logs

