import { Router } from "express"
import { createRateRoutes } from "@/routes/v1/rateRoutes"
import { RateController } from "@/controllers/rateController"

export function createV1Routes(rateController: RateController) {
  const router = Router()

  // Rate shopping endpoint
  router.use("/rates", createRateRoutes(rateController))

  return router
}
