export type ResponseStatus = 'SUCCESS' | 'FAILED';

export interface ApiMeta {
  timestamp: string;
  request_id?: string;
  trace_id?: string;
  duration_ms?: number;
  [key: string]: any;
}

export interface PaginationMeta {
  cursor?: string | null;
  next_cursor?: string | null;
  has_more: boolean;
  limit: number;
  total_count?: number;
}

export interface ApiResponse<T = any> {
  status: ResponseStatus;
  message: string;
  data: T | null;
  meta: ApiMeta;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T> {
  meta: ApiMeta & {
    pagination: PaginationMeta;
  };
}

export interface ApiError {
  code: string;
  description: string;
  details?: any;
}

export interface ErrorResponse extends ApiResponse<null> {
  error?: ApiError;
  debug?: {
    error_details?: string;
    request_path?: string;
    request_method?: string;
    environment?: string;
    debug_mode?: boolean;
    stack_trace?: string;
  };
}

export class ResponseBuilder {
  static success<T>(
    message: string,
    data: T,
    meta: Partial<ApiMeta> = {}
  ): ApiResponse<T> {
    return {
      status: 'SUCCESS',
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  static successPaginated<T>(
    message: string,
    data: T,
    pagination: PaginationMeta,
    meta: Partial<ApiMeta> = {}
  ): PaginatedApiResponse<T> {
    return {
      status: 'SUCCESS',
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
        pagination,
      },
    };
  }

  static error(
    message: string,
    error?: ApiError,
    meta: Partial<ApiMeta> = {},
    debug?: ErrorResponse['debug']
  ): ErrorResponse {
    const response: ErrorResponse = {
      status: 'FAILED',
      message,
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };

    if (error) {
      response.error = error;
    }

    if (debug && process.env.NODE_ENV !== 'production') {
      response.debug = debug;
    }

    return response;
  }
}

