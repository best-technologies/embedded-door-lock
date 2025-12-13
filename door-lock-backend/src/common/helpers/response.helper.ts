import { ApiResponse } from '../interfaces/api-response.interface';

export class ResponseHelper {
  /**
   * Create a successful response
   */
  static success<T>(
    message: string,
    data?: T | T[],
    total?: number,
  ): ApiResponse<T> {
    const response: ApiResponse<T> = {
      success: true,
      message,
    };

    if (Array.isArray(data)) {
      response.data = data;
      if (total !== undefined) {
        response.total = total;
      } else {
        response.total = data.length;
      }
    } else if (data !== undefined) {
      response.data = [data] as T[];
      response.total = 1;
    }

    return response;
  }

  /**
   * Create an error response
   */
  static error<T>(message: string, data?: T | T[]): ApiResponse<T> {
    const response: ApiResponse<T> = {
      success: false,
      message,
    };

    if (data !== undefined) {
      if (Array.isArray(data)) {
        response.data = data as T[];
        response.total = data.length;
      } else {
        response.data = [data] as T[];
        response.total = 1;
      }
    }

    return response;
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    message: string,
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): ApiResponse<T> & {
    page: number;
    limit: number;
    totalPages: number;
  } {
    return {
      success: true,
      message,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a verification response (for access verification endpoints)
   * Returns data as object, not array, with proper success/error status
   */
  static verification<T extends { authorized: boolean }>(
    message: string,
    data: T,
    authorized: boolean = true,
  ): {
    success: boolean;
    message: string;
    data: T;
  } {
    return {
      success: authorized,
      message,
      data,
    };
  }
}

