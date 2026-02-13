import { RateProvider } from "@/providers/carrierProvider"
import { CarrierError } from "@/domain/errors/appError"
import { RateRequest, RateQuote, Parcel } from "@/domain/models/rate"
import { HttpClient } from "@/infrastructure/http/httpClient"
import { EnvConfig } from "@/domain/models/config"
import { OAuthManager } from "@/infrastructure/auth/oauthManager"
import { FedExRateResponse } from "./fedexTypes"

export class FedexProvider implements RateProvider {
  name = "FedEx"

  constructor(
    private http: HttpClient,
    private auth: OAuthManager,
    private env: EnvConfig
  ) {}

  async getRates(req: RateRequest): Promise<RateQuote[]> {
    const token = await this.auth.getToken()

    const payload = {
      accountNumber: { value: this.env.FEDEX_ACCOUNT },
      requestedShipment: {
        shipper: {
          address: {
            postalCode: req.origin.postalCode,
            countryCode: req.origin.country
          }
        },
        recipient: {
          address: {
            postalCode: req.destination.postalCode,
            countryCode: req.destination.country
          }
        },
        requestedPackageLineItems: req.parcels.map((p: Parcel) => ({
          weight: { value: p.weight, units: "LB" }
        }))
      }
    }

    const res = await this.http.post<FedExRateResponse>(
      `${this.env.FEDEX_URL}/rate/v1/rates/quotes`,
      payload,
      { 
        Authorization: `Bearer ${token}`,
        "X-locale": "en_US",
        "Content-Type": "application/json"
      }
    )

    if (!res?.output?.rateReplyDetails)
      throw new CarrierError("Malformed FedEx response")

    return res.output.rateReplyDetails.map(r => ({
      carrier: "FedEx",
      service: r.serviceType,
      amount: Number(r.ratedShipmentDetails[0].totalNetCharge),
      currency: r.ratedShipmentDetails[0].currency
    }))
  }
}
