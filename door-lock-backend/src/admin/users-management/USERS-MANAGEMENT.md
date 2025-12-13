# Users Management Module

Admin-only module for managing users in the door lock system.

## Overview

The Users Management module provides administrative endpoints for managing user accounts, roles, and permissions. All endpoints require admin authentication and authorization.

**Base URL**: `/api/v1/admin/users-management`

---

## Authentication

All endpoints require:
- **JWT Bearer Token** in the Authorization header
- **Admin Role** - User must have `admin` role

```
Authorization: Bearer <jwt-token>
```

---

## Endpoints

### 1. Enroll New User

Create a new user account in the system. A unique userId and employeeId will be auto-generated. A secure password will be automatically generated and sent to the user via email along with their account details.

**Endpoint**: `POST /api/v1/admin/users-management`

**Notes**: 
- A secure 12-character password is automatically generated and sent to the user via email. The user can use this password to sign in to the system.
- A unique employeeId in format `EMP-XXX` (e.g., `EMP-001`, `EMP-002`) will be auto-generated if not provided. Employee IDs are sequential and unique.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | Yes | First name of the user |
| `lastName` | string | Yes | Last name of the user |
| `email` | string | Yes | Email address (must be unique) |
| `phoneNumber` | string | No | Phone number |
| `gender` | enum | No | Gender: `M`, `F`, `OTHER` |
| `employeeId` | string | No | Employee ID (if not provided, will be auto-generated in format EMP-XXX) |
| `role` | enum | Yes | User role: `admin`, `staff`, `employee`, `nysc`, `intern` |
| `department` | enum | No | Department |
| `accessLevel` | number | No | Access level 1-10 (default: 1) |
| `allowedAccessMethods` | array | Yes | Array of access methods: `rfid`, `fingerprint`, `keypad` |
| `keypadPin` | string | No | Keypad PIN (will be hashed) |
| `status` | enum | Yes | Account status: `active`, `inactive`, `suspended` |

**Example Request:**
```bash
POST /api/v1/admin/users-management
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+2348012345678",
  "gender": "M",
  "role": "staff",
  "department": "Engineering",
  "accessLevel": 1,
  "allowedAccessMethods": ["rfid", "fingerprint"],
  "keypadPin": "1234",
  "status": "active"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User enrolled successfully",
  "data": {
    "id": "clx1234567890abcdef",
    "userId": "BTL-25-11-13",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+2348012345678",
    "gender": "M",
    "employeeId": "EMP-001",
    "role": "staff",
    "department": "Engineering",
    "status": "active",
    "accessLevel": 1,
    "allowedAccessMethods": ["rfid", "fingerprint"],
    "lastAccessAt": null,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "profilePicture": null,
    "rfidTags": [],
    "fingerprintIds": []
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data or validation errors
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User does not have admin role
- `409 Conflict` - User with email or employeeId already exists

**Example Error Response (409):**
```json
{
  "success": false,
  "message": "User with this email already exists",
  "statusCode": 409
}
```

---

### 2. Get All Users

Retrieve a paginated list of all users with optional filtering.

**Endpoint**: `GET /api/v1/admin/users-management`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |
| `status` | enum | No | Filter by status: `active`, `suspended`, `terminated` |
| `role` | enum | No | Filter by role: `staff`, `intern`, `nysc`, `trainee`, `admin`, `contractor`, `visitor` |
| `department` | enum | No | Filter by department: `Engineering`, `HR`, `Finance`, `Operations`, `IT`, `Sales`, `Marketing`, `Administration`, `Security`, `Maintenance` |

**Example Request:**
```bash
GET /api/v1/admin/users-management?page=1&limit=20&status=active&role=staff
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "clx1234567890",
      "userId": "BTL-25-11-13",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+1234567890",
      "gender": "M",
      "employeeId": "EMP001",
      "status": "active",
      "role": "staff",
      "department": "Engineering",
      "accessLevel": 1,
      "allowedAccessMethods": ["rfid", "fingerprint"],
      "lastAccessAt": "2025-01-20T08:30:00.000Z",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-20T15:30:00.000Z",
      "profilePicture": {
        "secureUrl": "https://example.com/image.jpg",
        "publicId": "profile-123"
      },
      "rfidTags": ["A1B2C3D4"],
      "fingerprintIds": [1, 2]
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User does not have admin role

---

### 3. Update User

Update user information including name, email, status, role, department, and other fields.

**Endpoint**: `PATCH /api/v1/admin/users-management/:userId`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User ID (format: BTL-25-11-13) |

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+1234567890",
  "gender": "M",
  "employeeId": "EMP001",
  "status": "active",
  "role": "staff",
  "department": "Engineering",
  "accessLevel": 1,
  "allowedAccessMethods": ["rfid", "fingerprint"]
}
```

**Request DTO** (`UpdateUserDto`):

All fields are optional. Only provide the fields you want to update.

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `firstName` | string | No | Valid string | User's first name |
| `lastName` | string | No | Valid string | User's last name |
| `email` | string | No | Valid email format | User's email address (must be unique) |
| `phoneNumber` | string | No | Valid string | User's phone number |
| `gender` | enum | No | M or F | User's gender |
| `employeeId` | string | No | Valid string | Employee ID (must be unique) |
| `status` | enum | No | active, suspended, terminated | User account status |
| `role` | enum | No | Valid UserRole | User role |
| `department` | enum | No | Valid Department | User's department |
| `accessLevel` | number | No | 1-10 | Access level |
| `allowedAccessMethods` | array | No | Array of AccessMethod | Allowed access methods |

**Example Request:**
```bash
PATCH /api/v1/admin/users-management/BTL-25-11-13
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "status": "active",
  "department": "Engineering"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "clx1234567890",
    "userId": "BTL-25-11-13",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "gender": "M",
    "employeeId": "EMP001",
    "status": "active",
    "role": "staff",
    "department": "Engineering",
    "accessLevel": 1,
    "allowedAccessMethods": ["rfid", "fingerprint"],
    "lastAccessAt": "2025-01-20T08:30:00.000Z",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-20T15:30:00.000Z",
    "profilePicture": {
      "secureUrl": "https://example.com/image.jpg",
      "publicId": "profile-123"
    },
    "rfidTags": ["A1B2C3D4"],
    "fingerprintIds": [1, 2]
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid data provided
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User does not have admin role
- `404 Not Found` - User with the specified ID not found
- `409 Conflict` - Email or Employee ID already in use

**Error Response Examples:**

**409 Conflict (Email already in use):**
```json
{
  "statusCode": 409,
  "message": "Email john.doe@example.com is already in use",
  "error": "Conflict"
}
```

**409 Conflict (Employee ID already in use):**
```json
{
  "statusCode": 409,
  "message": "Employee ID EMP001 is already in use",
  "error": "Conflict"
}
```

---

### 4. Update User Role

Update the role of a specific user.

**Endpoint**: `PATCH /api/v1/admin/users-management/:userId/role`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User ID (format: BTL-25-11-13) |

**Request Body:**
```json
{
  "role": "staff"
}
```

**Request DTO** (`UpdateUserRoleDto`):

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `role` | enum | Yes | Must be valid UserRole | New role to assign: `staff`, `intern`, `nysc`, `trainee`, `admin`, `contractor`, `visitor` |

**Example Request:**
```bash
PATCH /api/v1/admin/users-management/BTL-25-11-13/role
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "role": "staff"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "userId": "BTL-25-11-13",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "staff",
    "status": "active",
    "department": "Engineering",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-20T15:30:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - User already has the specified role
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User does not have admin role
- `404 Not Found` - User with the specified ID not found

**Error Response Examples:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "User already has the role: staff",
  "error": "Bad Request"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "User with ID BTL-25-11-13 not found",
  "error": "Not Found"
}
```

---

### 5. Add RFID Tag to User

Attach an RFID tag to a user for RFID-based access.

**Endpoint**: `POST /api/v1/admin/users-management/:userId/rfid-tags`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User ID (format: BTL-25-11-13) |

**Request Body:**
```json
{
  "tag": "0xA1B2C3D4"
}
```

**Request DTO** (`AddRfidTagDto`):

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `tag` | string | Yes | Non-empty string | RFID tag value (e.g., 0xA1B2C3D4) |

**Example Request:**
```bash
POST /api/v1/admin/users-management/BTL-25-11-13/rfid-tags
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "tag": "0xA1B2C3D4"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "RFID tag added successfully",
  "data": {
    "id": "clx1234567890",
    "tag": "0xA1B2C3D4",
    "userId": "BTL-25-11-13",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User does not have admin role
- `404 Not Found` - User with the specified ID not found
- `409 Conflict` - RFID tag already registered for this user

---

### 6. Register Fingerprint for User

Register a fingerprint ID from the device for fingerprint-based access.

**Endpoint**: `POST /api/v1/admin/users-management/:userId/fingerprints`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User ID (format: BTL-25-11-13) |

**Request Body:**
```json
{
  "fingerprintId": 1
}
```

**Request DTO** (`RegisterFingerprintDto`):

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `fingerprintId` | number | Yes | Integer, minimum 1 | Fingerprint ID from the device (1, 2, 3, etc.) |

**Example Request:**
```bash
POST /api/v1/admin/users-management/BTL-25-11-13/fingerprints
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "fingerprintId": 1
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Fingerprint registered successfully",
  "data": {
    "id": "clx1234567890",
    "fingerprintId": 1,
    "userId": "BTL-25-11-13",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User does not have admin role
- `404 Not Found` - User with the specified ID not found
- `409 Conflict` - Fingerprint ID already registered for this user

---

### 7. Set Keypad PIN for User

Set or update the keypad PIN for a user. The PIN will be hashed before storage.

**Endpoint**: `PATCH /api/v1/admin/users-management/:userId/keypad-pin`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User ID (format: BTL-25-11-13) |

**Request Body:**
```json
{
  "pin": "1234"
}
```

**Request DTO** (`SetKeypadPinDto`):

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `pin` | string | Yes | 4-10 characters | Keypad PIN (will be hashed) |

**Example Request:**
```bash
PATCH /api/v1/admin/users-management/BTL-25-11-13/keypad-pin
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "pin": "1234"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Keypad PIN set successfully",
  "data": {
    "userId": "BTL-25-11-13",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid PIN (must be 4-10 characters)
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User does not have admin role
- `404 Not Found` - User with the specified ID not found

---

## User Roles

The system supports the following user roles:

- `admin` - System administrators with full access
- `staff` - Regular employees
- `intern` - Interns
- `nysc` - NYSC members
- `trainee` - Trainees
- `contractor` - Contractors
- `visitor` - Visitors

---

## User Status

Users can have the following statuses:

- `active` - User account is active and can access the system
- `suspended` - User account is temporarily suspended
- `terminated` - User account is permanently terminated

---

## Departments

Available departments:

- `Engineering`
- `HR`
- `Finance`
- `Operations`
- `IT`
- `Sales`
- `Marketing`
- `Administration`
- `Security`
- `Maintenance`

---

## Usage Examples

### Example 1: Get All Active Staff Users

```bash
curl -X GET "http://localhost:3000/api/v1/admin/users-management?status=active&role=staff&page=1&limit=20" \
  -H "Authorization: Bearer <jwt-token>"
```

### Example 2: Update User Information

```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/users-management/BTL-25-11-13" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "status": "active",
    "department": "Engineering"
  }'
```

### Example 3: Update User Role

```bash
curl -X PATCH "http://localhost:3000/api/v1/admin/users-management/BTL-25-11-13/role" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

### Example 4: Get Users by Department

```bash
curl -X GET "http://localhost:3000/api/v1/admin/users-management?department=Engineering&page=1&limit=10" \
  -H "Authorization: Bearer <jwt-token>"
```

### Example 5: Using with JavaScript/TypeScript

```typescript
// Get all users
const response = await fetch(
  'http://localhost:3000/api/v1/admin/users-management?page=1&limit=20',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
);

const data = await response.json();

if (data.success) {
  const users = data.data;
  const total = data.total;
  const page = data.page;
  // Use the data...
}

// Update user information
const updateUserResponse = await fetch(
  'http://localhost:3000/api/v1/admin/users-management/BTL-25-11-13',
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      status: 'active',
      department: 'Engineering',
    }),
  }
);

const updateUserData = await updateUserResponse.json();

// Update user role
const updateRoleResponse = await fetch(
  'http://localhost:3000/api/v1/admin/users-management/BTL-25-11-13/role',
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'admin',
    }),
  }
);

const updateRoleData = await updateRoleResponse.json();
```

### Example 6: Using with Axios

```typescript
import axios from 'axios';

// Enroll a new user
const enrollUser = async (
  token: string,
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    gender?: string;
    employeeId?: string;
    role: string;
    department?: string;
    accessLevel?: number;
    allowedAccessMethods: string[];
    keypadPin?: string;
    status: string;
  }
) => {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/v1/admin/users-management',
      userData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      console.error('Invalid input data');
    } else if (error.response?.status === 409) {
      console.error('Email or Employee ID already exists');
    } else if (error.response?.status === 401) {
      console.error('Unauthorized - Invalid token');
    } else if (error.response?.status === 403) {
      console.error('Forbidden - Admin access required');
    }
    throw error;
  }
};

// Get all users with filters
const getUsers = async (token: string, filters?: {
  page?: number;
  limit?: number;
  status?: string;
  role?: string;
  department?: string;
}) => {
  try {
    const response = await axios.get(
      'http://localhost:3000/api/v1/admin/users-management',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: filters,
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.error('Unauthorized - Invalid token');
    } else if (error.response?.status === 403) {
      console.error('Forbidden - Admin access required');
    }
    throw error;
  }
};

// Update user information
const updateUser = async (
  token: string,
  userId: string,
  userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    gender?: string;
    employeeId?: string;
    status?: string;
    role?: string;
    department?: string;
    accessLevel?: number;
    allowedAccessMethods?: string[];
  }
) => {
  try {
    const response = await axios.patch(
      `http://localhost:3000/api/v1/admin/users-management/${userId}`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('User not found');
    } else if (error.response?.status === 409) {
      console.error('Email or Employee ID already in use');
    }
    throw error;
  }
};

// Update user role
const updateUserRole = async (token: string, userId: string, role: string) => {
  try {
    const response = await axios.patch(
      `http://localhost:3000/api/v1/admin/users-management/${userId}/role`,
      { role },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('User not found');
    } else if (error.response?.status === 400) {
      console.error('User already has this role');
    }
    throw error;
  }
};
```

---

## Security

### Authentication

All endpoints require:
1. Valid JWT token in the Authorization header
2. Token must be signed with the correct secret
3. User must be active

### Authorization

All endpoints require:
1. User role must be `admin`
2. Role is checked via `RolesGuard`

### Error Handling

- **401 Unauthorized**: Returned when:
  - No token provided
  - Invalid token
  - Token expired
  - User not found
  - User account not active

- **403 Forbidden**: Returned when:
  - User does not have admin role
  - User role is not in the allowed roles list

---

## Response Data Structure

### User Object

```typescript
{
  id: string;                    // Prisma ID
  userId: string;                // Custom user ID (BTL-25-11-13)
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  gender: 'M' | 'F' | null;
  employeeId: string | null;
  status: 'active' | 'suspended' | 'terminated';
  role: UserRole;
  department: Department | null;
  accessLevel: number;
  allowedAccessMethods: AccessMethod[];
  lastAccessAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profilePicture: {
    secureUrl: string;
    publicId: string;
  } | null;
  rfidTags: string[];
  fingerprintIds: number[];
}
```

### Paginated Response

```typescript
{
  success: boolean;
  message: string;
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## Module Structure

```
src/admin/users-management/
├── users-management.controller.ts    # API endpoints
├── users-management.service.ts       # Business logic
├── users-management.module.ts        # NestJS module
├── dto/
│   ├── update-user-role.dto.ts       # Update role DTO
│   └── filter-users.dto.ts           # Filter users DTO
├── docs/
│   ├── update-user-role.decorators.ts
│   └── get-all-users.decorators.ts
└── USERS-MANAGEMENT.md              # This file
```

---

## Integration

This module is part of the Admin module and is automatically protected with:
- `@AdminOnly()` decorator at controller level
- JWT authentication guard
- Roles guard (admin only)

---

## Notes

1. **User ID Format**: User IDs follow the format `BTL-YY-MM-SS` (e.g., `BTL-25-11-13`)
2. **Pagination**: Default page size is 20, maximum recommended is 100
3. **Role Updates**: Cannot update a user's role to the same role they already have
4. **Filtering**: Multiple filters can be combined (e.g., status + role + department)
5. **Ordering**: Users are returned in descending order by creation date (newest first)

---

## Future Enhancements

Potential improvements:
- Bulk role updates
- User search by name or email
- Export users to CSV/Excel
- User activity history
- Role-based permissions management
- Department management endpoints
- User status management endpoints

---

## Support

For issues or questions:
- Check application logs for detailed error messages
- Verify JWT token is valid and not expired
- Ensure user has admin role assigned
- Check database connectivity
- Review API documentation (Swagger) for endpoint details

