# Door Lock Backend API

Backend API for door lock system with RFID and fingerprint authentication. Built with NestJS.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
```

### Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The application will be available at `http://localhost:3000/api/v1`

## 📁 Project Structure

```
src/
├── common/              # Shared utilities, DTOs, entities, interfaces
│   ├── dto/            # Common DTOs (pagination, etc.)
│   ├── entities/       # Entity classes
│   └── interfaces/     # TypeScript interfaces
├── users/              # User management module
│   ├── dto/           # User-related DTOs
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── access/             # Access logs module
│   ├── dto/
│   ├── access.controller.ts
│   ├── access.service.ts
│   └── access.module.ts
├── devices/            # Device management module
│   ├── dto/
│   ├── devices.controller.ts
│   ├── devices.service.ts
│   └── devices.module.ts
├── sync/               # Sync module for embedded systems
│   ├── dto/
│   ├── sync.controller.ts
│   ├── sync.service.ts
│   └── sync.module.ts
├── dashboard/          # Dashboard/analytics module
│   ├── dashboard.controller.ts
│   ├── dashboard.service.ts
│   └── dashboard.module.ts
├── app.module.ts       # Root module
└── main.ts            # Application entry point
```

## 📚 API Endpoints

### User Management

- `GET /api/v1/users` - Get all users (with filtering)
- `GET /api/v1/users/:userId` - Get user by ID
- `POST /api/v1/users` - Create new user
- `PATCH /api/v1/users/:userId/status` - Update user status
- `DELETE /api/v1/users/:userId` - Delete user
- `GET /api/v1/users/:userId/access-history` - Get user access history

### Access Logs

- `POST /api/v1/access/logs` - Create access log
- `GET /api/v1/access/logs` - Get all access logs (with filtering)

### Devices

- `GET /api/v1/devices` - Get all devices
- `GET /api/v1/devices/:deviceId` - Get device by ID
- `PATCH /api/v1/devices/:deviceId/settings` - Update device settings

### Sync

- `GET /api/v1/sync/updates` - Get sync updates for embedded systems

### Dashboard

- `GET /api/v1/dashboard/summary` - Get dashboard summary statistics

For detailed API documentation, see [DOCUMENTATION/general.md](./DOCUMENTATION/general.md)

## 🛠️ Development

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## 🔧 Configuration

Environment variables can be configured in `.env` file:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `API_PREFIX` - API prefix (default: api)
- `API_VERSION` - API version (default: v1)
- `CORS_ORIGIN` - CORS origin (default: *)

## 📝 Notes

- Currently using in-memory storage. Database integration is marked with `TODO` comments.
- All endpoints are ready for embedded system integration as per the API documentation.
- Validation is enabled globally using `class-validator` and `class-transformer`.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

UNLICENSED
