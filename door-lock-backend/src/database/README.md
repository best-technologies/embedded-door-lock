# Database Setup

This project uses Prisma ORM with PostgreSQL.

## Configuration

The database connection is configured via environment variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/doorlock?schema=public"
```

## Prisma Service

The `PrismaService` extends `PrismaClient` and handles:

- ✅ Automatic connection on module initialization
- ✅ Graceful disconnection on module destruction
- ✅ Development query logging
- ✅ Error handling with logger integration
- ✅ Shutdown hooks for clean application exit

## Usage

### Inject PrismaService

```typescript
import { PrismaService } from './database/prisma.service';

@Injectable()
export class YourService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }
}
```

## Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:migrate:deploy

# Reset database (development)
npm run prisma:migrate:reset

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Run seed script
npm run prisma:seed
```

## Database Module

The `DatabaseModule` is global, so `PrismaService` is available throughout the application without importing the module in each feature module.

## Next Steps

1. Define your models in `prisma/schema.prisma`
2. Run `npm run prisma:migrate` to create migrations
3. Use `PrismaService` in your services to interact with the database

