# Health Module

Health check endpoint and keep-alive service for Render.com and other hosting platforms.

## Features

- ✅ Health check endpoint (excluded from API prefix)
- ✅ Database connection status check
- ✅ Automatic keep-alive cron job (runs every 13 minutes)
- ✅ Configurable health endpoint path

## Configuration

Add to your `.env` file:

```env
API_HEALTH_ENDPOINT=/health
BACKEND_BASE_URL=http://localhost:3000
```

## Health Endpoint

The health endpoint is accessible at the root level (not under API prefix):

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "database": "connected"
}
```

## Keep-Alive Service

The `KeepAliveService` automatically pings the health endpoint every 13 minutes to keep the service awake on Render.com or similar platforms.

### How it works

1. On module initialization, logs the keep-alive configuration
2. Every 13 minutes, makes an HTTP/HTTPS request to the health endpoint
3. Logs success or failure of each ping
4. Helps prevent Render.com free tier from spinning down the service

### Cron Schedule

- **Pattern:** `*/13 * * * *` (every 13 minutes)
- **Time Zone:** UTC
- **Job Name:** `keep-alive`

## Usage

The health endpoint and keep-alive service are automatically enabled when the `HealthModule` is imported in `AppModule`.

### Manual Health Check

```bash
curl http://localhost:3000/health
```

### Disable Keep-Alive (if needed)

To disable the keep-alive service, remove `KeepAliveService` from the `HealthModule` providers array.

## Logs

The keep-alive service logs:
- Initialization message on startup
- Success messages when health check succeeds
- Warning messages for non-200 status codes
- Error messages for connection failures

Example logs:
```
[INFO] [KeepAliveService] Keep-alive service initialized. Will ping http://localhost:3000/health every 13 minutes
[INFO] [KeepAliveService] Pinging health endpoint: http://localhost:3000/health
[SUCCESS] [KeepAliveService] Health check successful: 200
```

