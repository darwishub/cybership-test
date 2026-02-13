import { Router } from "express"
import { RateController } from "@/controllers/rateController"
import { asyncHandler } from "@/middleware/asyncHandler"

export function createRateRoutes(controller: RateController) {
  const router = Router()

  router.post("/", asyncHandler(controller.getRates))

  return router
}
