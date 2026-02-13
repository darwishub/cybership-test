// UPS API Response Types
export interface UpsRateResponse {
  RateResponse: {
    RatedShipment: Array<{
      Service: {
        Code: string
      }
      TotalCharges: {
        MonetaryValue: string
        CurrencyCode: string
      }
    }>
  }
}

export interface UpsAuthResponse {
  access_token: string
  expires_in: number
}
