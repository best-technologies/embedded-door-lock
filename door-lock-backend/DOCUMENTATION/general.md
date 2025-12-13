# Embedded System API Documentation

## Overview

This document provides the complete API specification for embedded system engineers working with ESP32/RFID/fingerprint devices. These endpoints are designed for direct data exchange between embedded devices and the backend system, without requiring authentication or admin login endpoints.

## Goal

Provide the Embedded System Engineer with all backend endpoints required to:

- Fetch and sync user data
- Log access events
- Update statuses (like active/suspended)
- Retrieve user access history
- Fetch system-wide settings/configurations
- Log or sync device information

---

## User Management

### 1. GET /users

**Description:** Fetch all registered users (for sync to device memory).

Supports filtering by status, department, role, or date range.

**Query Parameters:**
- `status` - Filter by user status (e.g., `active`, `suspended`)
- `role` - Filter by user role (e.g., `staff`, `admin`)
- `department` - Filter by department
- `limit` - Limit number of results

**Query Examples:**
```
/users?status=active
/users?role=staff&department=admin&limit=50
```

**Response Example:**
```json
[
  {
    "userId": "USR12345",
    "firstName": "Mayowa",
    "lastName": "Bernard",
    "email": "bernardmayowaa@gmail.com",
    "employeeId": "EMP-001",
    "profilePicture": "https://cdn.company.com/users/USR12345.jpg",
    "authTypes": ["fingerprint", "rfid"],
    "rfidTags": ["0xA1B2C3D4"],
    "fingerprintIds": [1, 2],
    "status": "active",
    "role": "staff",
    "lastAccessAt": "2025-11-08T12:00:00Z",
    "createdAt": "2025-01-15T08:32:00Z"
  }
]
```

---

### 2. GET /users/:userId

**Description:** Retrieve full details of a specific user.

**Response Example:**
```json
{
  "userId": "USR12345",
  "firstName": "Mayowa",
  "lastName": "Bernard",
  "email": "bernardmayowaa@gmail.com",
  "authTypes": ["fingerprint", "rfid"],
  "rfidTags": ["0xA1B2C3D4"],
  "fingerprintIds": [1, 2],
  "status": "active",
  "role": "admin",
  "department": "Engineering",
  "lastAccessAt": "2025-11-08T12:00:00Z"
}
```

---

### 3. PATCH /users/:userId/status

**Description:** Change user account status (e.g., active, suspended, terminated).

**Request Body:**
```json
{
  "status": "suspended"
}
```

**Response:**
```json
{
  "userId": "USR12345",
  "newStatus": "suspended",
  "updatedAt": "2025-11-08T12:05:00Z"
}
```

---

### 4. DELETE /users/:userId

**Description:** Delete or revoke user access (soft delete recommended).

**Response:**
```json
{
  "message": "User access revoked",
  "userId": "USR12345"
}
```

---

### 5. GET /users/:userId/access-history

**Description:** Retrieve a user's access attempt history (success/fail, timestamps, device used).

**Query Parameters:**
- `from` - Start date (ISO 8601 format)
- `to` - End date (ISO 8601 format)
- `type` - Filter by result type (e.g., `success`, `failed`)

**Query Example:**
```
/users/:userId/access-history?from=2025-11-01&to=2025-11-08&type=success
```

**Response Example:**
```json
[
  {
    "timestamp": "2025-11-08T08:35:12Z",
    "deviceId": "DOOR-001",
    "accessType": "rfid",
    "result": "success",
    "message": "Access granted"
  },
  {
    "timestamp": "2025-11-07T18:22:09Z",
    "deviceId": "DOOR-001",
    "accessType": "fingerprint",
    "result": "failed",
    "message": "Unauthorized"
  }
]
```

---

## Door Access Logs

### 6. POST /access/logs

**Description:** The embedded device calls this to report door access attempts.

**Request Body:**
```json
{
  "deviceId": "DOOR-001",
  "userId": "USR12345",
  "method": "rfid",
  "rfidUid": "0xA1B2C3D4",
  "status": "success",
  "timestamp": "2025-11-08T08:35:12Z"
}
```

**Response:**
```json
{
  "status": "received",
  "logId": "LOG-10045"
}
```

---

### 7. GET /access/logs

**Description:** Fetch all access events (for monitoring, dashboard, or audit).

**Query Parameters:**
- `deviceId` - Filter by device ID
- `userId` - Filter by user ID
- `status` - Filter by access status (e.g., `success`, `failed`)
- `method` - Filter by access method (e.g., `rfid`, `fingerprint`)
- `from` - Start date (ISO 8601 format)
- `to` - End date (ISO 8601 format)
- `limit` - Limit number of results

**Query Example:**
```
/access/logs?deviceId=DOOR-001&status=failed&limit=50
```

**Response Example:**
```json
[
  {
    "logId": "LOG-10045",
    "userId": "USR12345",
    "userName": "Mayowa Bernard",
    "method": "rfid",
    "status": "success",
    "deviceId": "DOOR-001",
    "timestamp": "2025-11-08T08:35:12Z"
  }
]
```

---

## Access Verification

### 8. POST /access/verify-rfid

**Description:** Verify an RFID tag and return user information if the tag is registered and authorized. This endpoint is called by the ESP8266/ESP32 device when an RFID card is scanned.

**Request Body:**
```json
{
  "rfidTag": "0xA1B2C3D4",
  "deviceId": "DOOR-001"
}
```

**Request Parameters:**
- `rfidTag` (required) - RFID tag value (e.g., "0xA1B2C3D4" or "A1B2C3D4")
- `deviceId` (optional) - Device ID making the request

**Response (Authorized):**
```json
{
  "success": true,
  "message": "RFID tag verified successfully",
  "data": {
    "authorized": true,
    "user": {
      "userId": "BTL-25-11-13",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "status": "active",
      "role": "staff",
      "department": "Engineering",
      "allowedAccessMethods": ["rfid", "keypad"],
      "rfidTags": ["A1B2C3D4"],
      "fingerprintIds": [1, 2]
    }
  }
}
```

**Response (Not Authorized):**
```json
{
  "success": true,
  "message": "RFID tag verification failed",
  "data": {
    "authorized": false,
    "user": null,
    "reason": "RFID tag not registered"
  }
}
```

**Possible Reasons for Failure:**
- `"RFID tag not registered"` - Tag not found in database
- `"User account is suspended"` - User account is not active
- `"RFID access method not enabled for this user"` - User doesn't have RFID access enabled

---

### 9. POST /access/verify-fingerprint

**Description:** Verify a fingerprint ID and return user information if the fingerprint is registered and authorized. This endpoint is called by the ESP8266/ESP32 device when a fingerprint is scanned.

**Request Body:**
```json
{
  "fingerprintId": 1,
  "deviceId": "DOOR-001"
}
```

**Request Parameters:**
- `fingerprintId` (required) - Fingerprint ID from the device (integer, minimum: 1)
- `deviceId` (optional) - Device ID making the request

**Response (Authorized):**
```json
{
  "success": true,
  "message": "Fingerprint ID verified successfully",
  "data": {
    "authorized": true,
    "user": {
      "userId": "BTL-25-11-13",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "status": "active",
      "role": "staff",
      "department": "Engineering",
      "allowedAccessMethods": ["fingerprint", "rfid"],
      "rfidTags": ["A1B2C3D4"],
      "fingerprintIds": [1, 2]
    }
  }
}
```

**Response (Not Authorized):**
```json
{
  "success": true,
  "message": "Fingerprint ID verification failed",
  "data": {
    "authorized": false,
    "user": null,
    "reason": "Fingerprint ID not registered"
  }
}
```

**Possible Reasons for Failure:**
- `"Fingerprint ID not registered"` - Fingerprint ID not found in database
- `"User account is suspended"` - User account is not active
- `"Fingerprint access method not enabled for this user"` - User doesn't have fingerprint access enabled

**Note:** Both verification endpoints return HTTP 200 status code regardless of authorization result. Check the `authorized` field in the response to determine if access should be granted.

---

## Device Operations

### 10. GET /devices

**Description:** List all door controller devices registered in the system.

**Response Example:**
```json
[
  {
    "deviceId": "DOOR-001",
    "name": "Main Office Door",
    "location": "Engineering Block",
    "status": "online",
    "lastSeen": "2025-11-08T08:40:00Z"
  }
]
```

---

### 11. GET /devices/:deviceId

**Description:** Get single device details and configuration (door name, lock delay, network info).

**Response Example:**
```json
{
  "deviceId": "DOOR-001",
  "name": "Main Office Door",
  "location": "Engineering Block",
  "status": "online",
  "firmwareVersion": "v1.3.2",
  "settings": {
    "autoLockDelay": 3000,
    "volume": 7,
    "ledBrightness": 80
  }
}
```

---

### 12. PATCH /devices/:deviceId/settings

**Description:** Update door device configuration from the backend (optional).

**Request Body:**
```json
{
  "autoLockDelay": 5000,
  "volume": 5,
  "ledBrightness": 60
}
```

**Response:**
```json
{
  "deviceId": "DOOR-001",
  "updated": true
}
```

---

## General / Monitoring

### 13. GET /dashboard/summary

**Description:** Return summarized stats (total users, devices online/offline, today's access count).

**Response Example:**
```json
{
  "totalUsers": 250,
  "activeUsers": 230,
  "suspendedUsers": 10,
  "devicesOnline": 3,
  "devicesOffline": 1,
  "accessAttemptsToday": 96,
  "successfulAttempts": 91,
  "failedAttempts": 5
}
```

---

## Optional Endpoints (for better sync)

### 12. GET /sync/updates

**Description:** Embedded system polls for updates since last sync (e.g. new users, status changes).

**Query Parameters:**
- `since` - Timestamp of last sync (ISO 8601 format)

**Query Example:**
```
/sync/updates?since=2025-11-07T10:00:00Z
```

**Response Example:**
```json
{
  "newUsers": [...],
  "updatedUsers": [...],
  "revokedUsers": ["USR128", "USR300"],
  "timestamp": "2025-11-08T09:00:00Z"
}
```

---

## Priority Order for Embedded Engineer

| Priority | Endpoint | Purpose |
|----------|----------|---------|
| 🥇 High | `GET /users` | To fetch all registered users & their auth methods |
| 🥇 High | `GET /users/:userId` | Fetch details of one user |
| 🥇 High | `POST /access/logs` | Device sends door access logs |
| 🥈 Medium | `PATCH /users/:userId/status` | Suspend/activate user remotely |
| 🥈 Medium | `GET /users/:userId/access-history` | Fetch access history for display |
| 🥉 Low | `GET /devices` & `GET /devices/:id` | Optional monitoring info |
| 🥉 Low | `GET /sync/updates` | For periodic device sync |
| 🥉 Low | `GET /dashboard/summary` | Optional summary API for display screen |

---

## Next Steps

The following can be generated from this specification:

- **OpenAPI (Swagger) Specification** - Structured YAML or JSON for the embedded system engineer to integrate
- **NestJS Controller + DTO Templates** - Ready-to-use code stubs for backend implementation
