// Custom error classes for better error handling

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, "NOT_FOUND", 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, "FORBIDDEN", 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, "RATE_LIMIT_EXCEEDED", 429);
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string,
    public originalError?: any
  ) {
    super(`${service} error: ${message}`, "EXTERNAL_SERVICE_ERROR", 502);
  }
}

export class AIProviderError extends ExternalServiceError {
  constructor(provider: string, message: string, originalError?: any) {
    super(`AI Provider ${provider}`, message, originalError);
    this.code = "AI_PROVIDER_ERROR";
  }
}

export class StorageError extends ExternalServiceError {
  constructor(operation: string, message: string, originalError?: any) {
    super(`Storage during ${operation}`, message, originalError);
    this.code = "STORAGE_ERROR";
  }
}

// Error handling utility functions
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

export const createErrorResponse = (error: Error) => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error instanceof ValidationError && error.field && { field: error.field }),
      },
    };
  }

  // For unexpected errors, don't expose internal details
  console.error("Unexpected error:", error);
  return {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An internal error occurred",
    },
  };
};