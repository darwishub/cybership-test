import { RateProvider } from "@/providers/carrierProvider"
import { CarrierError } from "@/domain/errors/appError"
import { RateRequest, RateQuote, Parcel } from "@/domain/models/rate"
import { HttpClient } from "@/infrastructure/http/httpClient"
import { EnvConfig } from "@/domain/models/config"
import { OAuthManager } from "@/infrastructure/auth/oauthManager"
import { UpsRateResponse } from "./upsTypes"

export class UpsProvider implements RateProvider {
  name = "UPS"

  constructor(
    private http: HttpClient,
    private auth: OAuthManager,
    private env: EnvConfig
  ) {}

  async getRates(req: RateRequest): Promise<RateQuote[]> {
    const token = await this.auth.getToken()

    const payload = {
      RateRequest: {
        Shipment: {
          Shipper: { Address: { PostalCode: req.origin.postalCode } },
          ShipTo: { Address: { PostalCode: req.destination.postalCode } },
          Package: req.parcels.map((p: Parcel) => ({
            PackageWeight: { Weight: p.weight }
          }))
        }
      }
    }

    const res = await this.http.post<UpsRateResponse>(
      `${this.env.UPS_URL}/rating`,
      payload,
      { Authorization: `Bearer ${token}` }
    )

    if (!res?.RateResponse?.RatedShipment)
      throw new CarrierError("Malformed UPS response")

    return res.RateResponse.RatedShipment.map(r => ({
      carrier: "UPS",
      service: r.Service.Code,
      amount: Number(r.TotalCharges.MonetaryValue),
      currency: r.TotalCharges.CurrencyCode
    }))
  }
}
