export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public code?: string
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: unknown) {
    super(message, 400, true, "VALIDATION_ERROR")
  }
}

export class CarrierError extends AppError {
  constructor(
    message: string,
    public carrier?: string,
    public originalError?: unknown
  ) {
    super(message, 502, true, "CARRIER_ERROR")
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, 401, true, "AUTH_ERROR")
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, true, "NOT_FOUND")
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429, true, "RATE_LIMIT")
  }
}

export class NetworkError extends AppError {
  constructor(message: string, public originalError?: unknown) {
    super(message, 503, true, "NETWORK_ERROR")
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = "Request timeout") {
    super(message, 408, true, "TIMEOUT")
  }
}
