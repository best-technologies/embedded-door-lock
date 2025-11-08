export interface ApiResponse<T> {
  success: boolean;
  message: string;
  total?: number;
  data?: T[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

