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

