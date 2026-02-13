import dotenv from "dotenv"
import { EnvConfig } from "@/domain/models/config"
dotenv.config()

export const env: EnvConfig = {
  PORT: process.env.PORT || "3000",
  
  // UPS Configuration
  UPS_ID: process.env.UPS_ID!,
  UPS_SECRET: process.env.UPS_SECRET!,
  UPS_URL: process.env.UPS_URL!,
  
  // FedEx Configuration
  FEDEX_ID: process.env.FEDEX_ID!,
  FEDEX_SECRET: process.env.FEDEX_SECRET!,
  FEDEX_ACCOUNT: process.env.FEDEX_ACCOUNT!,
  FEDEX_URL: process.env.FEDEX_URL!
}
