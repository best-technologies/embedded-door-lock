# Attendance Tracking System

A comprehensive attendance tracking system that automatically records employee attendance based on door access logs, with support for working days, office hours, holidays, and detailed attendance statistics.

## Overview

The attendance system automatically tracks when employees enter and exit the office through door access logs. It calculates attendance status, working hours, late arrivals, early departures, and handles holidays and weekends intelligently.

## Features

- ✅ **Automatic Attendance Recording** - Records attendance automatically when users successfully access the door
- ✅ **Working Days Configuration** - Supports Monday-Friday (configurable)
- ✅ **Office Hours Management** - Configurable opening and closing times
- ✅ **Holiday Management** - Mark holidays to prevent false absences
- ✅ **Smart Status Calculation** - Automatically determines: Present, Absent, Late, Early Departure, Half Day, Holiday, Weekend
- ✅ **Attendance Statistics** - Comprehensive stats including attendance percentage, average hours, etc.
- ✅ **Flexible Filtering** - Filter by user, date range, status, department
- ✅ **Manual Attendance Entry** - Support for manual attendance corrections

## Integration with Access Logs

The attendance system is **fully integrated** with the access entry endpoint:

### Automatic Recording

When a user successfully accesses the door via `POST /access/logs` with `status: "success"`, the system automatically:

1. Records the access log in the database
2. Creates or updates the attendance record for that user on that date
3. Sets the check-in time (first access) or check-out time (last access)
4. Calculates attendance status based on office hours and working days

**Example Flow:**
```
User scans RFID card → POST /access/logs (status: "success") 
→ Access log created → Attendance automatically recorded
```

### Error Handling

If attendance recording fails, the access log creation still succeeds. Errors are logged as warnings but don't block the access log operation.

## Database Schema

### Attendance Model

```prisma
model Attendance {
  id                String          @id @default(cuid())
  attendanceId      String          @unique
  userId            String
  user              User            @relation(...)
  date              DateTime        // Date of attendance
  checkIn           DateTime?       // First access time
  checkOut          DateTime?       // Last access time
  status            AttendanceStatus
  isWorkingDay      Boolean
  isHoliday         Boolean
  holidayName       String?
  minutesLate       Int?
  minutesEarly      Int?
  totalHours        Float?
  notes             String?
  createdAt         DateTime
  updatedAt         DateTime
}
```

### Holiday Model

```prisma
model Holiday {
  id          String   @id @default(cuid())
  name        String
  date        DateTime
  isRecurring Boolean  // Repeats every year
  description String?
  createdAt   DateTime
  updatedAt   DateTime
}
```

### Attendance Status Enum

- `present` - User checked in and worked full day
- `absent` - No check-in recorded on a working day
- `late` - Checked in after opening time + threshold
- `early_departure` - Checked out before closing time
- `half_day` - Worked less than 4 hours or no check-out
- `holiday` - Day marked as holiday
- `weekend` - Saturday or Sunday

## Configuration

### Environment Variables

Add these to your `.env` file (all optional with defaults):

```env
# Office Hours
OFFICE_OPENING_TIME=08:00          # Default: 08:00
OFFICE_CLOSING_TIME=17:00           # Default: 17:00
LATE_THRESHOLD_MINUTES=15          # Default: 15 minutes

# Checkout Window (Time range for valid checkout)
CHECKOUT_WINDOW_START=16:50        # Default: 16:50 (4:50 PM)
CHECKOUT_WINDOW_END=17:05          # Default: 17:05 (5:05 PM)

# Working Days (1=Monday, 0=Sunday)
WORKING_DAYS=1,2,3,4,5             # Default: Monday-Friday
```

### Checkout Window

The checkout window defines the time range during which door access is considered a valid checkout. This prevents mid-day exits (e.g., going out for lunch) from being recorded as the checkout time.

- **CHECKOUT_WINDOW_START**: Start time of checkout window (default: 16:50 / 4:50 PM)
- **CHECKOUT_WINDOW_END**: End time of checkout window (default: 17:05 / 5:05 PM)

**How it works:**
- First access of the day = Check-in time (regardless of time)
- Last access within checkout window = Check-out time
- Accesses outside checkout window are ignored for checkout purposes

**Example Scenario:**
```
8:00 AM  - User enters → Check-in recorded
9:00 AM  - User exits (lunch) → Ignored (outside checkout window)
9:30 AM  - User returns → Ignored (outside checkout window)
5:00 PM  - User exits → Check-out recorded (within checkout window)
```

### Checkout Window

The checkout window defines the time range during which door access is considered a valid checkout. This prevents mid-day exits (e.g., going out for lunch, running errands) from being recorded as the checkout time.

**How it works:**
- **First access of the day** = Check-in time (regardless of time)
- **Last access within checkout window** = Check-out time
- Accesses outside checkout window are ignored for checkout purposes

**Example Scenario:**
```
8:00 AM  - User enters → Check-in recorded (8:00 AM)
9:00 AM  - User exits (lunch) → Ignored (outside checkout window)
9:30 AM  - User returns → Ignored (outside checkout window)
5:00 PM  - User exits → Check-out recorded (5:00 PM, within checkout window)
```

**Result:** Check-in: 8:00 AM, Check-out: 5:00 PM ✅

Without checkout window, the system would incorrectly record:
- Check-in: 8:00 AM
- Check-out: 9:30 AM ❌ (wrong - this was the return from lunch)

### Working Days Format

- `0` = Sunday
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

Example: `WORKING_DAYS=1,2,3,4,5` means Monday through Friday.

## API Endpoints

### 1. Create/Update Attendance Record

Manually create or update an attendance record.

**Endpoint:** `POST /attendance`

**Request Body:**
```json
{
  "userId": "user-id-here",
  "date": "2025-01-15",
  "checkIn": "2025-01-15T08:30:00Z",
  "checkOut": "2025-01-15T17:00:00Z",
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance recorded successfully",
  "data": {
    "id": "...",
    "attendanceId": "ATT-2025-01-15-user-id",
    "userId": "user-id-here",
    "date": "2025-01-15T00:00:00Z",
    "checkIn": "2025-01-15T08:30:00Z",
    "checkOut": "2025-01-15T17:00:00Z",
    "status": "present",
    "totalHours": 8.5,
    "user": { ... }
  }
}
```

### 2. Get Attendance Records

Retrieve attendance records with optional filtering.

**Endpoint:** `GET /attendance`

**Query Parameters:**
- `userId` (optional) - Filter by user ID
- `from` (optional) - Start date (ISO date string)
- `to` (optional) - End date (ISO date string)
- `status` (optional) - Filter by status: `present`, `absent`, `late`, `early_departure`, `half_day`, `holiday`, `weekend`
- `department` (optional) - Filter by department
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Example:**
```
GET /attendance?userId=user-123&from=2025-01-01&to=2025-01-31&status=present
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance records retrieved successfully",
  "data": {
    "data": [
      {
        "id": "...",
        "attendanceId": "ATT-2025-01-15-user-id",
        "userId": "user-id",
        "date": "2025-01-15T00:00:00Z",
        "checkIn": "2025-01-15T08:30:00Z",
        "checkOut": "2025-01-15T17:00:00Z",
        "status": "present",
        "minutesLate": 30,
        "totalHours": 8.5,
        "user": {
          "userId": "BTL-25-11-13",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "department": "Engineering"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

### 3. Get Attendance Statistics

Get comprehensive attendance statistics for a user or all users.

**Endpoint:** `GET /attendance/stats`

**Query Parameters:**
- `userId` (optional) - User ID to get stats for (if omitted, returns stats for all users)
- `from` (optional) - Start date (default: first day of current month)
- `to` (optional) - End date (default: today)

**Example:**
```
GET /attendance/stats?userId=user-123&from=2025-01-01&to=2025-01-31
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance statistics retrieved successfully",
  "data": {
    "totalDays": 31,
    "workingDays": 23,
    "present": 20,
    "absent": 1,
    "late": 2,
    "earlyDeparture": 0,
    "halfDay": 0,
    "holidays": 2,
    "weekends": 8,
    "attendancePercentage": 95.24,
    "averageHoursPerDay": 8.2
  }
}
```

### 4. Create Holiday

Add a holiday to the system.

**Endpoint:** `POST /attendance/holidays`

**Request Body:**
```json
{
  "name": "Christmas Day",
  "date": "2025-12-25",
  "isRecurring": true,
  "description": "Annual Christmas holiday"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Holiday created successfully",
  "data": {
    "id": "...",
    "name": "Christmas Day",
    "date": "2025-12-25T00:00:00Z",
    "isRecurring": true,
    "description": "Annual Christmas holiday"
  }
}
```

### 5. Get Holidays

Retrieve all holidays, optionally filtered by date range.

**Endpoint:** `GET /attendance/holidays`

**Query Parameters:**
- `from` (optional) - Start date
- `to` (optional) - End date

**Example:**
```
GET /attendance/holidays?from=2025-01-01&to=2025-12-31
```

**Response:**
```json
{
  "success": true,
  "message": "Holidays retrieved successfully",
  "data": [
    {
      "id": "...",
      "name": "Christmas Day",
      "date": "2025-12-25T00:00:00Z",
      "isRecurring": true,
      "description": "Annual Christmas holiday"
    }
  ]
}
```

### 6. Delete Holiday

Remove a holiday from the system.

**Endpoint:** `DELETE /attendance/holidays/:id`

**Response:**
```json
{
  "success": true,
  "message": "Holiday deleted successfully"
}
```

## Attendance Status Calculation Logic

### Status Determination

1. **Weekend** - If the date is Saturday or Sunday (not in working days)
2. **Holiday** - If the date is marked as a holiday
3. **Absent** - If no check-in is recorded on a working day
4. **Late** - If check-in is after `openingTime + lateThreshold`
5. **Early Departure** - If check-out is more than 1 hour before closing time
6. **Half Day** - If total hours worked < 4 hours or no check-out recorded
7. **Present** - Otherwise (normal attendance)

### Time Calculations

- **Minutes Late**: Calculated from office opening time to actual check-in time
- **Minutes Early**: Calculated from actual check-out time to office closing time
- **Total Hours**: Calculated from check-in to check-out time

## Usage Examples

### Example 1: Automatic Attendance Recording

When a user accesses the door:

```bash
POST /access/logs
{
  "userId": "user-123",
  "deviceId": "DOOR-001",
  "method": "rfid",
  "status": "success",
  "timestamp": "2025-01-15T08:30:00Z"
}
```

The system automatically:
- Creates an access log
- Records attendance for user-123 on 2025-01-15
- Sets check-in time to 08:30:00
- Calculates status (e.g., "late" if after 08:15)

### Example 2: Manual Attendance Correction

If you need to manually correct attendance:

```bash
POST /attendance
{
  "userId": "user-123",
  "date": "2025-01-15",
  "checkIn": "2025-01-15T08:00:00Z",
  "checkOut": "2025-01-15T17:00:00Z",
  "notes": "Corrected - was marked late incorrectly"
}
```

### Example 3: Setting Up Holidays

Add recurring holidays at the beginning of the year:

```bash
POST /attendance/holidays
{
  "name": "New Year's Day",
  "date": "2025-01-01",
  "isRecurring": true
}

POST /attendance/holidays
{
  "name": "Christmas Day",
  "date": "2025-12-25",
  "isRecurring": true
}
```

### Example 4: Getting Monthly Attendance Report

```bash
GET /attendance/stats?userId=user-123&from=2025-01-01&to=2025-01-31
```

## Database Migration

After setting up the schema, run the migration:

```bash
npx prisma migrate dev --name add_attendance_and_holiday_models
```

Or if you want to create the migration file without applying it:

```bash
npx prisma migrate dev --name add_attendance_and_holiday_models --create-only
```

## Module Structure

```
src/attendance/
├── attendance.controller.ts    # API endpoints
├── attendance.service.ts          # Business logic
├── attendance.module.ts           # NestJS module
├── dto/
│   ├── create-attendance.dto.ts
│   ├── filter-attendance.dto.ts
│   ├── create-holiday.dto.ts
│   └── attendance-stats.dto.ts
└── ATTENDANCE.md                  # This file
```

## Integration Points

### With Access Module

The attendance service is injected into the access service using `forwardRef` to handle circular dependencies:

- `AccessService.create()` automatically calls `AttendanceService.recordAttendanceFromAccess()` when access is successful
- Errors in attendance recording don't block access log creation

### With Config Module

Uses `AppConfigService` for:
- Office opening/closing times
- Late threshold minutes
- Checkout window (start and end times)
- Working days configuration

## Best Practices

1. **Set up holidays early** - Add all holidays at the beginning of the year
2. **Use recurring holidays** - Mark annual holidays as recurring to avoid re-adding each year
3. **Monitor attendance stats** - Regularly check attendance statistics to identify patterns
4. **Manual corrections** - Use manual attendance entry for corrections, not regular tracking
5. **Office hours** - Configure office hours accurately to ensure correct late/early calculations

## Troubleshooting

### Attendance not being recorded

1. Check that `POST /access/logs` has `status: "success"`
2. Verify AttendanceModule is imported in AppModule
3. Check logs for attendance recording errors
4. Ensure database migration has been run

### Incorrect status calculation

1. Verify office hours in environment variables
2. Check working days configuration
3. Ensure holidays are properly set up
4. Verify check-in/check-out times are correct

### Holidays not working

1. Check holiday date format (should be date only, time is ignored)
2. For recurring holidays, verify month and day match
3. Ensure holiday date is within the date range being checked

## Support

For issues or questions, check:
- Database logs for errors
- Application logs for attendance service warnings
- Prisma schema for model definitions
- API documentation (Swagger) for endpoint details

---

## Frontend Integration Guide

This section provides code examples for integrating the attendance API endpoints into your frontend application.

### Base Configuration

```typescript
// config/api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken'); // or your token storage method
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};
```

### TypeScript Types

```typescript
// types/attendance.ts

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EARLY_DEPARTURE = 'early_departure',
  HALF_DAY = 'half_day',
  HOLIDAY = 'holiday',
  WEEKEND = 'weekend',
}

export interface AttendanceRecord {
  id: string;
  attendanceId: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  isWorkingDay: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  minutesLate: number | null;
  minutesEarly: number | null;
  totalHours: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string | null;
  };
}

export interface AttendanceListResponse {
  success: boolean;
  message: string;
  data: {
    data: AttendanceRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface AttendanceStats {
  totalDays: number;
  workingDays: number;
  present: number;
  absent: number;
  late: number;
  earlyDeparture: number;
  halfDay: number;
  holidays: number;
  weekends: number;
  attendancePercentage: number;
  averageHoursPerDay: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendanceDto {
  userId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  checkIn?: string; // ISO datetime string
  checkOut?: string; // ISO datetime string
  notes?: string;
}

export interface FilterAttendanceDto {
  userId?: string;
  from?: string; // ISO date string
  to?: string; // ISO date string
  status?: AttendanceStatus;
  department?: string;
  page?: number;
  limit?: number;
}

export interface CreateHolidayDto {
  name: string;
  date: string; // ISO date string (YYYY-MM-DD)
  isRecurring?: boolean;
  description?: string;
}
```

### API Service Functions

```typescript
// services/attendance.service.ts
import { API_BASE_URL, getAuthHeaders } from '../config/api';
import {
  AttendanceListResponse,
  AttendanceRecord,
  AttendanceStats,
  CreateAttendanceDto,
  FilterAttendanceDto,
  Holiday,
  CreateHolidayDto,
} from '../types/attendance';

/**
 * Get attendance records with optional filtering
 */
export const getAttendanceRecords = async (
  filters: FilterAttendanceDto = {}
): Promise<AttendanceListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (filters.userId) queryParams.append('userId', filters.userId);
  if (filters.from) queryParams.append('from', filters.from);
  if (filters.to) queryParams.append('to', filters.to);
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.department) queryParams.append('department', filters.department);
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());

  const response = await fetch(
    `${API_BASE_URL}/attendance?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch attendance records');
  }

  return response.json();
};

/**
 * Create or update attendance record manually
 */
export const createOrUpdateAttendance = async (
  data: CreateAttendanceDto
): Promise<{ success: boolean; message: string; data: AttendanceRecord }> => {
  const response = await fetch(`${API_BASE_URL}/attendance`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create/update attendance');
  }

  return response.json();
};

/**
 * Get attendance statistics
 */
export const getAttendanceStats = async (
  userId?: string,
  from?: string,
  to?: string
): Promise<{ success: boolean; message: string; data: AttendanceStats }> => {
  const queryParams = new URLSearchParams();
  if (userId) queryParams.append('userId', userId);
  if (from) queryParams.append('from', from);
  if (to) queryParams.append('to', to);

  const response = await fetch(
    `${API_BASE_URL}/attendance/stats?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch attendance statistics');
  }

  return response.json();
};

/**
 * Get all holidays
 */
export const getHolidays = async (
  from?: string,
  to?: string
): Promise<{ success: boolean; message: string; data: Holiday[] }> => {
  const queryParams = new URLSearchParams();
  if (from) queryParams.append('from', from);
  if (to) queryParams.append('to', to);

  const response = await fetch(
    `${API_BASE_URL}/attendance/holidays?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch holidays');
  }

  return response.json();
};

/**
 * Create a new holiday
 */
export const createHoliday = async (
  data: CreateHolidayDto
): Promise<{ success: boolean; message: string; data: Holiday }> => {
  const response = await fetch(`${API_BASE_URL}/attendance/holidays`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create holiday');
  }

  return response.json();
};

/**
 * Delete a holiday
 */
export const deleteHoliday = async (
  holidayId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/attendance/holidays/${holidayId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete holiday');
  }

  return response.json();
};
```

### Usage Examples

#### Example 1: Fetch Attendance Records with Filters

```typescript
// Fetch attendance for a specific user in January 2025
const fetchUserAttendance = async (userId: string) => {
  try {
    const response = await getAttendanceRecords({
      userId,
      from: '2025-01-01',
      to: '2025-01-31',
      page: 1,
      limit: 20,
    });

    const records = response.data.data;
    const pagination = response.data.pagination;
    
    console.log(`Found ${pagination.total} records`);
    return records;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

// Fetch all late attendance records
const fetchLateAttendance = async () => {
  try {
    const response = await getAttendanceRecords({
      status: AttendanceStatus.LATE,
      page: 1,
      limit: 50,
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching late attendance:', error);
    throw error;
  }
};
```

#### Example 2: Manual Attendance Correction

```typescript
const correctAttendance = async (
  userId: string,
  date: string,
  checkIn: string,
  checkOut: string,
  notes?: string
) => {
  try {
    const response = await createOrUpdateAttendance({
      userId,
      date, // Format: '2025-01-15'
      checkIn, // Format: '2025-01-15T08:00:00Z'
      checkOut, // Format: '2025-01-15T17:00:00Z'
      notes,
    });

    console.log('Attendance corrected:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error correcting attendance:', error);
    throw error;
  }
};
```

#### Example 3: Get Attendance Statistics

```typescript
// Get statistics for a specific user
const getUserStats = async (userId: string, month: string) => {
  try {
    const from = `${month}-01`;
    const to = `${month}-31`; // Adjust based on month
    
    const response = await getAttendanceStats(userId, from, to);
    const stats = response.data;
    
    console.log(`Attendance Percentage: ${stats.attendancePercentage}%`);
    console.log(`Present Days: ${stats.present}`);
    console.log(`Absent Days: ${stats.absent}`);
    console.log(`Late Days: ${stats.late}`);
    
    return stats;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

// Get statistics for all users
const getAllUsersStats = async (from: string, to: string) => {
  try {
    const response = await getAttendanceStats(undefined, from, to);
    return response.data;
  } catch (error) {
    console.error('Error fetching all users stats:', error);
    throw error;
  }
};
```

#### Example 4: Holiday Management

```typescript
// Get all holidays for the year
const fetchHolidays = async (year: number) => {
  try {
    const response = await getHolidays(
      `${year}-01-01`,
      `${year}-12-31`
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching holidays:', error);
    throw error;
  }
};

// Create a recurring holiday
const addRecurringHoliday = async (
  name: string,
  date: string,
  description?: string
) => {
  try {
    const response = await createHoliday({
      name,
      date, // Format: '2025-12-25'
      isRecurring: true,
      description,
    });
    
    console.log('Holiday created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating holiday:', error);
    throw error;
  }
};

// Create a one-time holiday
const addOneTimeHoliday = async (
  name: string,
  date: string,
  description?: string
) => {
  try {
    const response = await createHoliday({
      name,
      date,
      isRecurring: false,
      description,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating holiday:', error);
    throw error;
  }
};

// Delete a holiday
const removeHoliday = async (holidayId: string) => {
  try {
    await deleteHoliday(holidayId);
    console.log('Holiday deleted successfully');
  } catch (error) {
    console.error('Error deleting holiday:', error);
    throw error;
  }
};
```

### Error Handling

```typescript
// Error handling wrapper
export const handleApiError = (error: any): string => {
  if (error.response) {
    // API returned an error response
    return error.response.data?.message || 'An error occurred';
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};

// Usage with try-catch
const fetchAttendanceWithErrorHandling = async () => {
  try {
    const response = await getAttendanceRecords();
    return response.data.data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    // Display error to user
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};
```

### Date Formatting Utilities

```typescript
// utils/date.ts

/**
 * Format ISO date string to display format
 */
export const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format ISO datetime string to time only
 */
export const formatTime = (isoDateTime: string | null): string => {
  if (!isoDateTime) return 'N/A';
  const date = new Date(isoDateTime);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Get date string in YYYY-MM-DD format
 */
export const getDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get ISO datetime string from date and time
 */
export const getDateTimeString = (date: Date, time: string): string => {
  const [hours, minutes] = time.split(':');
  const newDate = new Date(date);
  newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return newDate.toISOString();
};
```

### Status Badge Helper

```typescript
// utils/attendance.ts

export const getStatusColor = (status: AttendanceStatus): string => {
  const statusColors: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: 'green',
    [AttendanceStatus.ABSENT]: 'red',
    [AttendanceStatus.LATE]: 'orange',
    [AttendanceStatus.EARLY_DEPARTURE]: 'yellow',
    [AttendanceStatus.HALF_DAY]: 'blue',
    [AttendanceStatus.HOLIDAY]: 'purple',
    [AttendanceStatus.WEEKEND]: 'gray',
  };
  
  return statusColors[status] || 'gray';
};

export const getStatusLabel = (status: AttendanceStatus): string => {
  const labels: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: 'Present',
    [AttendanceStatus.ABSENT]: 'Absent',
    [AttendanceStatus.LATE]: 'Late',
    [AttendanceStatus.EARLY_DEPARTURE]: 'Early Departure',
    [AttendanceStatus.HALF_DAY]: 'Half Day',
    [AttendanceStatus.HOLIDAY]: 'Holiday',
    [AttendanceStatus.WEEKEND]: 'Weekend',
  };
  
  return labels[status] || status;
};
```

### React Hook Example (Optional)

```typescript
// hooks/useAttendance.ts
import { useState, useEffect } from 'react';
import { getAttendanceRecords, FilterAttendanceDto } from '../services/attendance.service';
import { AttendanceRecord } from '../types/attendance';

export const useAttendance = (filters: FilterAttendanceDto = {}) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAttendanceRecords(filters);
      setRecords(response.data.data);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [JSON.stringify(filters)]);

  return {
    records,
    loading,
    error,
    pagination,
    refetch: fetchRecords,
  };
};
```

---

## Summary

The frontend integration guide is located in: **`src/attendance/ATTENDANCE.md`** (Frontend Integration Guide section)

This guide provides:
- ✅ TypeScript type definitions
- ✅ API service functions for all endpoints
- ✅ Usage examples for each feature
- ✅ Error handling utilities
- ✅ Date formatting helpers
- ✅ Status utility functions
- ✅ Optional React hook example

All code examples are framework-agnostic and can be adapted to any frontend framework (React, Vue, Angular, etc.).

