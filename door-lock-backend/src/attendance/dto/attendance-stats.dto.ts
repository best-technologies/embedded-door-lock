import { ApiProperty } from '@nestjs/swagger';

export class AttendanceStatsDto {
  @ApiProperty({ description: 'Total days in period' })
  totalDays: number;

  @ApiProperty({ description: 'Working days in period' })
  workingDays: number;

  @ApiProperty({ description: 'Days present' })
  present: number;

  @ApiProperty({ description: 'Days absent' })
  absent: number;

  @ApiProperty({ description: 'Days late' })
  late: number;

  @ApiProperty({ description: 'Days with early departure' })
  earlyDeparture: number;

  @ApiProperty({ description: 'Half days' })
  halfDay: number;

  @ApiProperty({ description: 'Holidays in period' })
  holidays: number;

  @ApiProperty({ description: 'Weekends in period' })
  weekends: number;

  @ApiProperty({ description: 'Attendance percentage' })
  attendancePercentage: number;

  @ApiProperty({ description: 'Average hours worked per day' })
  averageHoursPerDay: number;
}

