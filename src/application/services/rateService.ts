import { ZodSchema } from "zod"
import { CarrierRepository } from "@/repositories/carrierRepository"
import { RateQuote, RateRequest } from "@/domain/models/rate"

export class RateService {

  constructor(
    private repo: CarrierRepository,
    private validator: ZodSchema<RateRequest>
  ) {}

  async execute(input: RateRequest): Promise<RateQuote[]> {
    const parsed = this.validator.parse(input)
    return this.repo.fetchRates(parsed)
  }
}
