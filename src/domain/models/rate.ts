export interface Address {
  country: string
  postalCode: string
  city: string
}

export interface Parcel {
  weight: number
  length: number
  width: number
  height: number
}

export interface RateRequest {
  origin: Address
  destination: Address
  parcels: Parcel[]
  serviceLevel?: string
}

export interface RateQuote {
  carrier: string
  service: string
  serviceName?: string
  amount: number
  currency: string
  estimatedDays?: string
}
