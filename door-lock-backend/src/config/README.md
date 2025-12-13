# Configuration Service

Centralized configuration management using `@nestjs/config`.

## Environment Variables

The following environment variables are supported:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development, production, test)
- `BACKEND_BASE_URL` - Base URL for the backend API

### Optional
- `PORT` - Server port (default: 3000)
- `API_PREFIX` - API prefix (default: api)
- `API_VERSION` - API version (default: v1)
- `CORS_ORIGIN` - CORS origin (default: *)
- `LOG_LEVEL` - Logging level (default: info)

## Usage

### Inject AppConfigService

```typescript
import { AppConfigService } from './config/config.service';

@Injectable()
export class YourService {
  constructor(private readonly config: AppConfigService) {}

  someMethod() {
    const dbUrl = this.config.databaseUrl;
    const isDev = this.config.isDevelopment;
    const baseUrl = this.config.backendBaseUrl;
  }
}
```

## Available Properties

- `nodeEnv` - Current environment
- `databaseUrl` - Database connection string
- `backendBaseUrl` - Backend base URL
- `port` - Server port
- `apiPrefix` - API prefix
- `apiVersion` - API version
- `corsOrigin` - CORS origin
- `logLevel` - Log level
- `isDevelopment` - Boolean for development mode
- `isProduction` - Boolean for production mode
- `isTest` - Boolean for test mode

## Configuration Module

The `AppConfigModule` is global, so `AppConfigService` is available throughout the application.

