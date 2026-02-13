import { Response } from "express"
import { ZodIssue } from "zod"

export default class ResponseFormatter {

  static success<T = unknown>(
    res: Response,
    message: string,
    data?: T,
    status = 200
  ) {
    return res.status(status).json({
      status: "success",
      message,
      data
    })
  }

  static created<T = unknown>(
    res: Response,
    message: string,
    data?: T
  ) {
    return this.success(res, message, data, 201)
  }

  static error(
    res: Response,
    message: string,
    status = 500,
    errors?: unknown,
    details?: string
  ) {
    const body: {
      status: string
      message: string
      errors?: unknown
      details?: string
    } = { status: "error", message }

    if (errors) body.errors = errors

    if (details && process.env.NODE_ENV === "development")
      body.details = details

    return res.status(status).json(body)
  }

  static validation(res: Response, errors: ZodIssue[]) {
    return this.error(res, "Validation failed", 422, errors)
  }

  static notFound(res: Response, msg = "Resource not found") {
    return this.error(res, msg, 404)
  }

  static badRequest(res: Response, msg: string, errors?: unknown) {
    return this.error(res, msg, 400, errors)
  }

  static conflict(res: Response, msg: string) {
    return this.error(res, msg, 409)
  }

  static internal(res: Response, msg = "Internal server error", err?: Error) {
    return this.error(res, msg, 500, undefined, err?.message)
  }
}
