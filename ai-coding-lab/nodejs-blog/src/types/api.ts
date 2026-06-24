export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
