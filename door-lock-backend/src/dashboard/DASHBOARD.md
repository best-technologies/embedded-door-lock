# Dashboard Module

A comprehensive dashboard system that provides administrative insights and statistics for the door lock management system.

## Overview

The dashboard module provides endpoints for viewing system statistics, user information, attendance data, and access logs. All endpoints are protected and require admin role authentication.

## Features

- ✅ **Dashboard Summary** - Basic statistics dashboard (admin-only)
- ✅ **Admin Dashboard** - Comprehensive admin-only dashboard with detailed analytics
- ✅ **Role-Based Access Control** - All endpoints protected with JWT and admin role requirement
- ✅ **Real-Time Statistics** - Current user counts, attendance, and device status
- ✅ **User Management Data** - Recent users, role breakdowns, department statistics
- ✅ **Attendance Tracking** - Today's attendance with formatted times and status
- ✅ **Access Log Monitoring** - Recent access attempts and device activity

## Module Structure

```
src/dashboard/
├── dashboard.controller.ts    # API endpoints
├── dashboard.service.ts        # Business logic
├── dashboard.module.ts         # NestJS module
└── DASHBOARD.md               # This file
```

## Dependencies

- **DatabaseModule** - Prisma database access
- **UsersModule** - User management services
- **DevicesModule** - Device management services
- **AccessModule** - Access log services
- **AttendanceModule** - Attendance tracking services
- **IdentityModule** - Authentication and authorization
- **LoggerModule** - Logging services

## API Endpoints

### 1. Dashboard Summary

**Endpoint:** `GET /dashboard/summary`

**Authentication:** Required (JWT Bearer Token)  
**Authorization:** Admin role required

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Description:** Get basic dashboard statistics. Requires admin authentication.

**Response:**
```json
{
  "totalUsers": 100,
  "activeUsers": 95,
  "suspendedUsers": 3,
  "devicesOnline": 8,
  "devicesOffline": 2,
  "accessAttemptsToday": 150,
  "successfulAttempts": 145,
  "failedAttempts": 5
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User does not have admin role

---

### 2. Admin Dashboard

**Endpoint:** `GET /dashboard/admin`

**Authentication:** Required (JWT Bearer Token)  
**Authorization:** Admin role required

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Description:** Get comprehensive admin dashboard data including:
- User statistics (total, by gender, by role, by status)
- Today's attendance with formatted times
- Recent users table
- Today's attendance table
- Department breakdown
- Recent access logs
- Device status

**Response Structure:**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "stats": {
      "totalUsers": {
        "total": 100,
        "male": 60,
        "female": 40,
        "notSpecified": 0
      },
      "totalAdmins": {
        "total": 5,
        "active": 5
      },
      "totalStaff": {
        "total": 85,
        "staff": 50,
        "nysc": 10,
        "intern": 15,
        "trainee": 5,
        "contractor": 3,
        "visitor": 2
      },
      "clockedInToday": {
        "total": 75,
        "male": 45,
        "female": 30,
        "present": 70,
        "late": 5,
        "absent": 10,
        "halfDay": 2,
        "earlyDeparture": 3
      },
      "userStatus": {
        "active": 95,
        "suspended": 3,
        "terminated": 2
      },
      "devices": {
        "total": 10,
        "online": 8,
        "offline": 2
      }
    },
    "recentUsers": [...],
    "todayAttendance": [...],
    "departmentBreakdown": {...},
    "recentAccessLogs": [...]
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User does not have admin role

---

## Data Structures

### Stats Object

```typescript
{
  totalUsers: {
    total: number;
    male: number;
    female: number;
    notSpecified: number;
  };
  totalAdmins: {
    total: number;
    active: number;
  };
  totalStaff: {
    total: number;
    staff: number;
    nysc: number;
    intern: number;
    trainee: number;
    contractor: number;
    visitor: number;
  };
  clockedInToday: {
    total: number;
    male: number;
    female: number;
    present: number;
    late: number;
    absent: number;
    halfDay: number;
    earlyDeparture: number;
  };
  userStatus: {
    active: number;
    suspended: number;
    terminated: number;
  };
  devices: {
    total: number;
    online: number;
    offline: number;
  };
}
```

### Recent Users Array

```typescript
[
  {
    userId: string;           // Format: BTL-25-11-13
    name: string;             // First + Last name
    email: string;
    role: UserRole;           // staff, intern, nysc, trainee, admin, contractor, visitor
    department: Department | null;
    status: UserStatus;      // active, suspended, terminated
    gender: Gender | null;   // M, F
    createdAt: Date;
    lastAccessAt: Date | null;
  }
]
```

### Today's Attendance Array

```typescript
[
  {
    id: string;
    date: string;             // ISO date string (YYYY-MM-DD)
    name: string;             // First + Last name
    checkIn: string;          // Formatted as "8:30 AM" or "-" if null
    checkOut: string;         // Formatted as "5:00 PM" or "-" if null
    status: AttendanceStatus; // present, absent, late, early_departure, half_day, holiday, weekend
    minutesLate: number | null;
    minutesEarly: number | null;
    totalHours: number | null;
    isWorkingDay: boolean;
    isHoliday: boolean;
    holidayName: string | null;
    user: {
      userId: string;
      email: string;
      role: UserRole;
      department: Department | null;
      gender: Gender | null;
    };
  }
]
```

### Department Breakdown

```typescript
{
  "Engineering": 25,
  "HR": 10,
  "Finance": 15,
  "Operations": 20,
  "IT": 12,
  "Sales": 8,
  "Marketing": 5,
  "Unassigned": 3
}
```

### Recent Access Logs Array

```typescript
[
  {
    logId: string;            // Format: LOG-1234567890-abc123
    timestamp: Date;          // ISO datetime string
    method: AccessMethod;     // rfid, fingerprint, keypad
    status: AccessStatus;     // success, failed
    user: {
      userId: string;
      name: string;           // First + Last name
      email: string;
    };
    device: {
      deviceId: string;       // Format: DOOR-001
      name: string;
      location: string;
    };
  }
]
```

## Time Formatting

All times in the attendance table are formatted in 12-hour format:
- Format: `"H:MM AM/PM"` (e.g., "8:30 AM", "5:00 PM")
- Null values are displayed as `"-"`

## User Roles

The system supports the following user roles:
- `admin` - System administrators
- `staff` - Regular employees
- `intern` - Interns
- `nysc` - NYSC members
- `trainee` - Trainees
- `contractor` - Contractors
- `visitor` - Visitors

## Attendance Status

- `present` - User checked in and worked full day
- `absent` - No check-in recorded on a working day
- `late` - Checked in after office opening time + threshold
- `early_departure` - Checked out before office closing time
- `half_day` - Worked less than 4 hours or no check-out
- `holiday` - Day marked as holiday
- `weekend` - Saturday or Sunday

## Security

### Authentication

The admin dashboard endpoint requires:
1. Valid JWT token in the Authorization header
2. Token must be signed with the correct secret
3. User must be active

### Authorization

The admin dashboard endpoint requires:
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

## Usage Examples

### Example 1: Get Dashboard Summary

```bash
curl -X GET http://localhost:3000/api/v1/dashboard/summary \
  -H "Authorization: Bearer <jwt-token>"
```

**Response:**
```json
{
  "totalUsers": 100,
  "activeUsers": 95,
  "suspendedUsers": 3,
  "devicesOnline": 8,
  "devicesOffline": 2,
  "accessAttemptsToday": 150,
  "successfulAttempts": 145,
  "failedAttempts": 5
}
```

### Example 2: Get Admin Dashboard

```bash
curl -X GET http://localhost:3000/api/v1/dashboard/admin \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:** (See full response structure above)

### Example 3: Using with JavaScript/TypeScript

```typescript
// Get admin dashboard
const response = await fetch('http://localhost:3000/api/v1/dashboard/admin', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();

if (data.success) {
  const stats = data.data.stats;
  const recentUsers = data.data.recentUsers;
  const todayAttendance = data.data.todayAttendance;
  
  // Use the data...
}
```

### Example 4: Using with Axios

```typescript
import axios from 'axios';

const getAdminDashboard = async (token: string) => {
  try {
    const response = await axios.get(
      'http://localhost:3000/api/v1/dashboard/admin',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
```

## Performance Considerations

- The admin dashboard performs multiple database queries
- Recent users are limited to 5 records
- Recent access logs are limited to 10 records
- Today's attendance includes all records for the current day
- Consider implementing caching for high-traffic scenarios

## Integration with Other Modules

### Users Module
- Fetches user data and statistics
- Provides user role and department breakdowns

### Attendance Module
- Retrieves today's attendance records
- Calculates attendance statistics

### Access Module
- Fetches recent access logs
- Provides access attempt statistics

### Devices Module
- Retrieves device status information
- Provides online/offline device counts

## Error Handling

All errors are logged using the LoggerService and return appropriate HTTP status codes:

- **500 Internal Server Error**: Database errors, service failures
- **401 Unauthorized**: Authentication failures
- **403 Forbidden**: Authorization failures

## Future Enhancements

Potential improvements:
- Date range filtering for attendance data
- Pagination for large datasets
- Caching for frequently accessed data
- Real-time updates via WebSocket
- Export functionality (CSV, PDF)
- Custom date range selection
- Advanced filtering options
- Dashboard customization per admin

## Support

For issues or questions:
- Check application logs for detailed error messages
- Verify JWT token is valid and not expired
- Ensure user has admin role assigned
- Check database connectivity
- Review API documentation (Swagger) for endpoint details

