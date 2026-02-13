import { CarrierProvider } from "@/providers/carrierProvider"
import { RateRequest, RateQuote } from "@/domain/models/rate"
import { CarrierError } from "@/domain/errors/appError"

export class CarrierRepository {

  constructor(private providers: CarrierProvider[]) {}

  async fetchRates(req: RateRequest): Promise<RateQuote[]> {

    const results = await Promise.allSettled(
      this.providers.map(p => p.getRates(req))
    )

    const quotes: RateQuote[] = []
    const errors: Array<{ carrier: string; error: Error }> = []

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const provider = this.providers[i]

      if (result.status === "fulfilled") {
        quotes.push(...result.value)
      } else {
        // Log error but continue with other carriers
        console.error(`❌ ${provider.name} failed:`, result.reason?.message || result.reason)
        errors.push({
          carrier: provider.name,
          error: result.reason
        })
      }
    }

    // If ALL carriers failed, throw error
    if (quotes.length === 0 && errors.length > 0) {
      const errorMessages = errors.map(e => `${e.carrier}: ${e.error.message}`).join('; ')
      throw new CarrierError(
        `All carriers failed to provide rates. Errors: ${errorMessages}`,
        undefined
      )
    }

    // Partial success warning
    if (errors.length > 0) {
      console.warn(`⚠️ Partial success: ${errors.map(e => e.carrier).join(', ')} failed, but ${quotes.length} rates returned`)
    }

    return quotes
  }
}
