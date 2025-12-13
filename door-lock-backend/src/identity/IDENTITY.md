# Identity API Documentation

## Overview

The Identity API provides authentication endpoints for user registration and sign-in. All endpoints return JWT access tokens that should be used for authenticated requests to protected endpoints.

**Base URL**: `/api/v1/identity`

---

## Authentication Flow

1. **Register** or **Sign In** to obtain a JWT access token
2. Include the token in subsequent requests using the `Authorization` header:
   ```
   Authorization: Bearer <access_token>
   ```
3. The token expires after the configured time (default: 24 hours)

---

## Endpoints

### 1. Sign In

Authenticate a user with email and password.

**Endpoint**: `POST /api/v1/identity/sign-in`

**Request Body**:
```json
{
  "email": "bernardmayowaa@gmail.com",
  "password": "SecurePassword123!"
}
```

**Request DTO** (`SignInDto`):
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `email` | `string` | Yes | Valid email format | User's email address |
| `password` | `string` | Yes | Minimum 6 characters | User's password |

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "User signed in successfully",
  "data": [
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "userId": "BTL-25-11-13",
        "firstName": "Mayowa",
        "lastName": "Bernard",
        "email": "bernardmayowaa@gmail.com",
        "status": "active",
        "role": "staff"
      }
    }
  ],
  "total": 1
}
```

**Error Responses**:

- **401 Unauthorized** - Invalid email or password:
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

- **401 Unauthorized** - User account is not active:
```json
{
  "success": false,
  "message": "User account is suspended"
}
```

---

### 2. Register

Register a new user account. A unique `userId` will be auto-generated based on role and current date.

**Endpoint**: `POST /api/v1/identity/register`

**Request Body**:
```json
{
  "firstName": "Mayowa",
  "lastName": "Bernard",
  "email": "bernardmayowaa@gmail.com",
  "password": "SecurePassword123!",
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

**Request DTO** (`RegisterDto`):

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `firstName` | `string` | Yes | - | User's first name |
| `lastName` | `string` | Yes | - | User's last name |
| `email` | `string` | Yes | Valid email format | User's email address (must be unique) |
| `password` | `string` | Yes | Minimum 6 characters | User's password (will be hashed) |
| `phoneNumber` | `string` | No | - | User's phone number |
| `gender` | `Gender` | No | Enum: `M`, `F` | User's gender |
| `role` | `UserRole` | Yes | Enum (see below) | User's role |
| `department` | `Department` | No | Enum (see below) | User's department |
| `accessLevel` | `number` | No | 1-10, default: 1 | Access level number |
| `allowedAccessMethods` | `AccessMethod[]` | Yes | Array of enums | Allowed access methods (see below) |
| `keypadPin` | `string` | No | - | Keypad PIN (will be hashed) |
| `status` | `UserStatus` | Yes | Enum (see below) | User account status |

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": [
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "userId": "BTL-25-11-13",
        "firstName": "Mayowa",
        "lastName": "Bernard",
        "email": "bernardmayowaa@gmail.com",
        "status": "active",
        "role": "staff"
      }
    }
  ],
  "total": 1
}
```

**Error Responses**:

- **400 Bad Request** - Validation failed:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ]
}
```

- **409 Conflict** - User already exists:
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

---

## Response Structures

### AuthResponseDto

The authentication response contains:

```typescript
{
  accessToken: string;  // JWT token for authenticated requests
  user: {
    userId: string;      // Unique user ID (format: BTL-YY-MM-SS)
    firstName: string;
    lastName: string;
    email: string;
    status: UserStatus;  // "active" | "suspended" | "terminated"
    role: UserRole;      // See enums below
  }
}
```

### Standard API Response Format

All endpoints follow this response structure:

```typescript
{
  success: boolean;      // true for success, false for errors
  message: string;       // Human-readable message
  data?: T[];           // Array of response data (wrapped in array)
  total?: number;       // Total count of items
}
```

---

## Enums

### UserRole

```typescript
enum UserRole {
  staff      // Regular staff member
  intern     // Intern
  nysc       // NYSC member
  trainee    // Trainee
  admin      // Administrator
  contractor // Contractor
  visitor    // Visitor
}
```

### UserStatus

```typescript
enum UserStatus {
  active      // Account is active
  suspended   // Account is suspended
  terminated  // Account is terminated
}
```

### Department

```typescript
enum Department {
  Engineering
  HR
  Finance
  Operations
  IT
  Sales
  Marketing
  Administration
  Security
  Maintenance
}
```

### Gender

```typescript
enum Gender {
  M  // Male
  F  // Female
}
```

### AccessMethod

```typescript
enum AccessMethod {
  rfid         // RFID card access
  fingerprint  // Fingerprint access
  keypad       // Keypad PIN access
}
```

---

## Using the JWT Token

After successful authentication, include the token in all protected API requests:

### JavaScript/TypeScript Example

```typescript
// Store token after sign-in/register
const response = await fetch('/api/v1/identity/sign-in', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
const token = data.data[0].accessToken;

// Use token in subsequent requests
const protectedResponse = await fetch('/api/v1/users', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});
```

### Axios Example

```typescript
import axios from 'axios';

// Sign in
const signInResponse = await axios.post('/api/v1/identity/sign-in', {
  email: 'user@example.com',
  password: 'password123'
});

const token = signInResponse.data.data[0].accessToken;

// Set default authorization header
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Make authenticated requests
const usersResponse = await axios.get('/api/v1/users');
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid input data or validation errors
- **401 Unauthorized** - Authentication failed or invalid credentials
- **409 Conflict** - Resource already exists (e.g., duplicate email)

---

## Examples

### Complete Sign-In Flow

```typescript
async function signIn(email: string, password: string) {
  try {
    const response = await fetch('/api/v1/identity/sign-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Sign in failed');
    }

    const { accessToken, user } = data.data[0];
    
    // Store token (e.g., in localStorage, secure storage, etc.)
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));

    return { accessToken, user };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}
```

### Complete Registration Flow

```typescript
async function register(userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  allowedAccessMethods: string[];
  status: string;
  // ... other optional fields
}) {
  try {
    const response = await fetch('/api/v1/identity/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Registration failed');
    }

    const { accessToken, user } = data.data[0];
    
    // Store token
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));

    return { accessToken, user };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}
```

---

## Notes

1. **Password Requirements**: Minimum 6 characters
2. **Email Uniqueness**: Email addresses must be unique across all users
3. **Employee ID**: Auto-generated in format `EMP-XXX` (e.g., `EMP-001`, `EMP-002`) - sequential and unique
4. **User ID Format**: Auto-generated in format `BTL-YY-MM-SS` (e.g., `BTL-25-11-13`)
5. **Token Expiration**: JWT tokens expire after 24 hours by default (configurable)
6. **Password Hashing**: Passwords are automatically hashed using bcrypt before storage
7. **Account Status**: Only users with `status: "active"` can sign in

---

## Support

For issues or questions, please contact the backend development team.

