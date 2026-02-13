import { Router } from "express"
import { createV1Routes } from "@/routes/v1"
import { RateController } from "@/controllers/rateController"

export function createApiRoutes(rateController: RateController) {
  const router = Router()

  // Version 1 routes
  router.use("/v1", createV1Routes(rateController))

  // Health check
  router.get("/health", (req, res) => {
    res.json({ status: "ok", version: "v1" })
  })

  return router
}
