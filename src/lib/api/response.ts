import { NextResponse } from "next/server";
import { APIResponse } from "@/types";
import { createErrorResponse } from "@/lib/errors";
import { v4 as uuidv4 } from "uuid";

// Response creation utilities
export const ApiResponse = {
  success: <T = any>(
    data: T,
    meta?: {
      requestId?: string;
      timestamp?: string;
      version?: string;
    }
  ): NextResponse<APIResponse<T>> => {
    const response: APIResponse<T> = {
      success: true,
      data,
      meta: {
        requestId: meta?.requestId || uuidv4(),
        timestamp: meta?.timestamp || new Date().toISOString(),
        version: "1.0.0",
        ...meta,
      },
    };

    return NextResponse.json(response);
  },

  error: (
    error: Error,
    status: number = 500,
    meta?: {
      requestId?: string;
      timestamp?: string;
      version?: string;
    }
  ): NextResponse<APIResponse> => {
    const errorResponse = createErrorResponse(error);

    const response: APIResponse = {
      ...errorResponse,
      meta: {
        requestId: meta?.requestId || uuidv4(),
        timestamp: meta?.timestamp || new Date().toISOString(),
        version: "1.0.0",
        ...meta,
      },
    };

    return NextResponse.json(response, { status });
  },

  paginated: <T = any>(
    items: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    meta?: {
      requestId?: string;
      timestamp?: string;
      version?: string;
    }
  ): NextResponse<APIResponse<{ items: T[]; pagination: any }>> => {
    return ApiResponse.success(
      {
        items,
        pagination,
      },
      meta
    );
  },
};

// Request validation utility
export async function validateRequest<T>(
  request: Request,
  schema: {
    parse: (data: any) => T;
  }
): Promise<{ data: T; error?: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    return {
      data: null as any,
      error: ApiResponse.error(
        new Error("Invalid request body"),
        400
      ),
    };
  }
}

// CORS headers utility
export const addCorsHeaders = (response: NextResponse): NextResponse => {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  return response;
};

// Handle OPTIONS requests for CORS
export const handleCors = (request: Request): NextResponse | null => {
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });
    return addCorsHeaders(response);
  }
  return null;
};

// Rate limiting check (simple implementation)
export const checkRateLimit = async (
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number }> => {
  // This is a simple in-memory implementation
  // In production, use Redis or a proper rate limiting store
  const requests = (global as any)._rateLimitRequests || {};
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean old entries
  const userRequests = requests[identifier] || [];
  const validRequests = userRequests.filter((timestamp: number) => timestamp > windowStart);

  if (validRequests.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  // Add current request
  validRequests.push(now);
  requests[identifier] = validRequests;
  (global as any)._rateLimitRequests = requests;

  return {
    allowed: true,
    remaining: limit - validRequests.length,
  };
};