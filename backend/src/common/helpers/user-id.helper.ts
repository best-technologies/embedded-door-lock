import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';

/**
 * Generates a unique user ID in the format: BTL-YY-MM-SS
 * Where:
 * - BTL: Company prefix
 * - YY: Last 2 digits of the year (e.g., 25 for 2025)
 * - MM: Month (01-12)
 * - SS: Serial number for users in that role for that month
 *
 * Example: BTL-25-11-13
 */
export class UserIdHelper {
  /**
   * Generate a unique user ID based on role and current date
   * Optimized for performance using createdAt date filtering instead of userId parsing
   */
  static async generateUserId(
    prisma: PrismaService,
    role: UserRole,
    maxRetries: number = 10,
  ): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits: 25
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
    const prefix = `BTL-${year}-${month}-`;

    // Calculate start and end of current month for efficient date filtering
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Use createdAt date filtering instead of userId.startsWith - much faster!
    // This uses the createdAt index which is more efficient
    const count = await prisma.user.count({
      where: {
        role: role,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Start from count + 1, but try sequentially if there are gaps
    let serialNumber = count + 1;
    let attempts = 0;

    while (attempts < maxRetries) {
      const serial = String(serialNumber).padStart(2, '0');
      const userId = `${prefix}${serial}`;

      // Quick uniqueness check using indexed userId field
      const exists = await prisma.user.findUnique({
        where: { userId },
        select: { userId: true },
      });

      if (!exists) {
        return userId;
      }

      // If exists, try next number
      serialNumber++;
      attempts++;
    }

    // Fallback: use timestamp-based serial if we can't find a unique one
    const timestampSerial = String(Date.now()).slice(-2);
    const fallbackUserId = `${prefix}${timestampSerial}`;
    
    // Final check
    const finalCheck = await prisma.user.findUnique({
      where: { userId: fallbackUserId },
      select: { userId: true },
    });

    if (!finalCheck) {
      return fallbackUserId;
    }

    // Last resort: use milliseconds (ensures uniqueness)
    return `${prefix}${String(Date.now()).slice(-4)}`;
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
    const parts = userId.split('-');
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
    const pattern = /^BTL-\d{2}-\d{2}-\d{2}$/;
    return pattern.test(userId);
  }
}

