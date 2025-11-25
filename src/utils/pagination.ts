// Pagination interfaces and utilities

export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
  }
  
  export interface PaginationMeta {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
  }
  
  export const DEFAULT_PAGE_SIZE = 10;
  export const MAX_PAGE_SIZE = 100;
  
  /**
   * Parse and validate pagination parameters from request query
   */
  export function parsePaginationParams(query: {
    page?: string;
    limit?: string;
  }): PaginationParams {
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(query.limit || DEFAULT_PAGE_SIZE.toString(), 10) || DEFAULT_PAGE_SIZE)
    );
    const offset = (page - 1) * limit;
  
    return { page, limit, offset };
  }
  
  /**
   * Create pagination metadata
   */
  export function createPaginationMeta(
    total: number,
    page: number,
    limit: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
  
    return {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNext,
      hasPrev,
    };
  }
  
  /**
   * Create a paginated response
   */
  export function createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    return {
      data,
      pagination: createPaginationMeta(total, page, limit),
    };
  }