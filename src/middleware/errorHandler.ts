import { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"
import ResponseFormatter from "@/utils/responseFormatter"
import { AppError } from "@/domain/errors/appError"

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for monitoring
  console.error('❌ Unhandled Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    body: req.body
  })

  // Zod validation errors
  if (err instanceof ZodError) {
    return ResponseFormatter.validation(res, err.issues)
  }

  // Operational errors (known)
  if (err instanceof AppError && err.isOperational) {
    return ResponseFormatter.error(
      res,
      err.message,
      err.statusCode,
      undefined,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    )
  }

  // Programming errors or unknown errors (500)
  return ResponseFormatter.internal(
    res,
    "An unexpected error occurred",
    err
  )
}

// Handle unhandled promise rejections
export const unhandledRejectionHandler = (reason: unknown) => {
  console.error('💥 Unhandled Rejection:', reason)
  // Optionally: send to monitoring service (Sentry, DataDog, etc.)
}

// Handle uncaught exceptions
export const uncaughtExceptionHandler = (error: Error) => {
  console.error('💥 Uncaught Exception:', error)
  // Optionally: gracefully shutdown
  process.exit(1)
}
