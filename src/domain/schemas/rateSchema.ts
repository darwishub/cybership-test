import { z } from "zod"

export const rateRequestSchema = z.object({
  origin: z.object({
    country: z.string(),
    postalCode: z.string(),
    city: z.string()
  }),
  destination: z.object({
    country: z.string(),
    postalCode: z.string(),
    city: z.string()
  }),
  parcels: z.array(
    z.object({
      weight: z.number().positive(),
      length: z.number(),
      width: z.number(),
      height: z.number()
    })
  )
})
