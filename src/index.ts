import express from "express"

import { RateController } from "@/controllers/rateController"
import { 
  errorHandler, 
  unhandledRejectionHandler,
  uncaughtExceptionHandler 
} from "@/middleware/errorHandler"

import { rateRequestSchema } from "@/domain/schemas/rateSchema"
import { CarrierRepository } from "@/repositories/carrierRepository"
import { RateService } from "@/application/services/rateService"

import { FetchHttpClient } from "@/infrastructure/http/fetchHttpClient"
import { UpsProvider } from "@/infrastructure/carriers/ups/upsProvider"
import { FedexProvider } from "@/infrastructure/carriers/fedex/fedexProvider"
import { OAuthManager } from "@/infrastructure/auth/oauthManager"
import { env } from "@/infrastructure/config/env"

import { createApiRoutes } from "@/routes"

const app = express()
app.use(express.json())

// Initialize HTTP client
const http = new FetchHttpClient()

// Initialize UPS provider with OAuth
const upsAuth = new OAuthManager(http, {
  tokenUrl: `${env.UPS_URL}/oauth/token`,
  clientId: env.UPS_ID,
  clientSecret: env.UPS_SECRET
})
const ups = new UpsProvider(http, upsAuth, env)

// Initialize FedEx provider with OAuth
const fedexAuth = new OAuthManager(http, {
  tokenUrl: `${env.FEDEX_URL}/oauth/token`,
  clientId: env.FEDEX_ID,
  clientSecret: env.FEDEX_SECRET
})
const fedex = new FedexProvider(http, fedexAuth, env)

// Initialize repository with multiple carriers
const repo = new CarrierRepository([ups, fedex])
const service = new RateService(repo, rateRequestSchema)
const controller = new RateController(service)

// Mount API routes with versioning
app.use("/api", createApiRoutes(controller))

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
    path: req.path
  })
})

// Global error handler (MUST be last)
app.use(errorHandler)

// Register global error handlers
process.on('unhandledRejection', unhandledRejectionHandler)
process.on('uncaughtException', uncaughtExceptionHandler)

const PORT = env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📦 API v1: http://localhost:${PORT}/api/v1`)
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`)
})
