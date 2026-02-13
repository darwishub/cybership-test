// FedEx API Response Types
export interface FedExRateResponse {
  output: {
    rateReplyDetails: Array<{
      serviceType: string
      ratedShipmentDetails: Array<{
        totalNetCharge: number
        currency: string
      }>
    }>
  }
}
