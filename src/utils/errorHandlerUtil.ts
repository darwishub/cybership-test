import { Response } from "express"
import ResponseFormatter from "@/utils/responseFormatter"
import { AppError, CarrierError, NetworkError } from "@/domain/errors/appError"
import { ZodError } from "zod"

/**
 * Centralized error handler utility for controllers
 * Handles all error types and returns appropriate HTTP responses
 */
export function handleControllerError(error: unknown, res: Response) {
  // Zod validation errors
  if (error instanceof ZodError) {
    return ResponseFormatter.validation(res, error.issues)
  }

  // Carrier-specific errors (UPS/FedEx API issues)
  if (error instanceof CarrierError) {
    return ResponseFormatter.error(
      res,
      `Carrier error: ${error.message}`,
      502,
      { carrier: error.carrier },
      error.originalError ? String(error.originalError) : undefined
    )
  }

  // Network/timeout errors
  if (error instanceof NetworkError) {
    return ResponseFormatter.error(
      res,
      "Unable to reach shipping carrier",
      503,
      undefined,
      error.originalError ? String(error.originalError) : undefined
    )
  }

  // Known application errors
  if (error instanceof AppError) {
    return ResponseFormatter.error(
      res,
      error.message,
      error.statusCode
    )
  }

  // Unknown errors
  const err = error instanceof Error ? error : new Error(String(error))
  return ResponseFormatter.internal(res, "An unexpected error occurred", err)
}
