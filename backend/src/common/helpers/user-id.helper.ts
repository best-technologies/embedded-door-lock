import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';

/**
 * Generates a unique user ID in the format: BTL/YY/MM/SS
 * Where:
 * - BTL: Company prefix
 * - YY: Last 2 digits of the year (e.g., 25 for 2025)
 * - MM: Month (01-12)
 * - SS: Serial number for users in that role for that month
 *
 * Example: BTL/25/11/13
 */
export class UserIdHelper {
  /**
   * Generate a unique user ID based on role and current date
   */
  static async generateUserId(
    prisma: PrismaService,
    role: UserRole,
  ): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits: 25
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12

    // Find the highest serial number for this role in this month
    const prefix = `BTL/${year}/${month}/`;
    const existingUsers = await prisma.user.findMany({
      where: {
        userId: {
          startsWith: prefix,
        },
        role: role,
      },
      select: {
        userId: true,
      },
      orderBy: {
        userId: 'desc',
      },
      take: 1,
    });

    let serialNumber = 1;

    if (existingUsers.length > 0) {
      // Extract serial number from the last user ID
      const lastUserId = existingUsers[0].userId;
      const lastSerial = parseInt(lastUserId.split('/').pop() || '0', 10);
      serialNumber = lastSerial + 1;
    }

    const serial = String(serialNumber).padStart(2, '0'); // 01, 02, etc.
    const userId = `BTL/${year}/${month}/${serial}`;

    // Double-check uniqueness (race condition protection)
    const exists = await prisma.user.findUnique({
      where: { userId },
    });

    if (exists) {
      // If exists, increment and try again
      return this.generateUserId(prisma, role);
    }

    return userId;
  }

  /**
   * Parse a user ID to extract its components
   */
  static parseUserId(userId: string): {
    prefix: string;
    year: string;
    month: string;
    serial: string;
  } | null {
    const parts = userId.split('/');
    if (parts.length !== 4 || parts[0] !== 'BTL') {
      return null;
    }

    return {
      prefix: parts[0],
      year: parts[1],
      month: parts[2],
      serial: parts[3],
    };
  }

  /**
   * Validate user ID format
   */
  static isValidUserId(userId: string): boolean {
    const pattern = /^BTL\/\d{2}\/\d{2}\/\d{2}$/;
    return pattern.test(userId);
  }
}

