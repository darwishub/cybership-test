import { RateRequest, RateQuote } from "@/domain/models/rate"

// Interface Segregation Principle - focused on rate shopping
export interface RateProvider {
  name: string
  getRates(req: RateRequest): Promise<RateQuote[]>
}

// Legacy interface for backward compatibility
export interface CarrierProvider extends RateProvider {}
