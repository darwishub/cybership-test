import { Request, Response, NextFunction } from "express"

// Express handler types
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>

export type ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => void | Response

// API Response types
export interface ApiResponse<T = unknown> {
  status: "success" | "error"
  message: string
  data?: T
  errors?: unknown
  details?: string
}

// Validation error type
export interface ValidationError {
  field: string
  message: string
}
