import { describe, it, expect, vi, beforeEach } from "vitest"
import { UpsProvider } from "@/infrastructure/carriers/ups/upsProvider"
import { HttpClient } from "@/infrastructure/http/httpClient"
import { OAuthManager } from "@/infrastructure/auth/oauthManager"
import { EnvConfig } from "@/domain/models/config"
import { CarrierError } from "@/domain/errors/appError"
import { RateRequest } from "@/domain/models/rate"

describe("UPS Provider Integration Tests", () => {
  const mockEnv: EnvConfig = {
    UPS_URL: "https://test.ups.com",
    UPS_ID: "test-id",
    UPS_SECRET: "test-secret",
    PORT: "3000",
    FEDEX_ID: "test-id",
    FEDEX_SECRET: "test-secret",
    FEDEX_ACCOUNT: "test",
    FEDEX_URL: "https://test.fedex.com"
  }

  const sampleRequest: RateRequest = {
    origin: { country: "US", postalCode: "10001", city: "NY" },
    destination: { country: "US", postalCode: "90001", city: "LA" },
    parcels: [{ weight: 1, length: 1, width: 1, height: 1 }]
  }

  describe("Successful Response Parsing", () => {
    it("should parse response with single rate", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockResolvedValue({
          RateResponse: {
            RatedShipment: [
              {
                Service: { Code: "03" },
                TotalCharges: { MonetaryValue: "10.00", CurrencyCode: "USD" }
              }
            ]
          }
        }),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("fake-token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)
      const result = await provider.getRates(sampleRequest)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        carrier: "UPS",
        service: "03",
        amount: 10,
        currency: "USD"
      })
    })

    it("should parse response with multiple rates", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockResolvedValue({
          RateResponse: {
            RatedShipment: [
              {
                Service: { Code: "03", Description: "Ground" },
                TotalCharges: { MonetaryValue: "10.50", CurrencyCode: "USD" }
              },
              {
                Service: { Code: "02", Description: "2nd Day Air" },
                TotalCharges: { MonetaryValue: "25.75", CurrencyCode: "USD" }
              },
              {
                Service: { Code: "01", Description: "Next Day Air" },
                TotalCharges: { MonetaryValue: "45.99", CurrencyCode: "USD" }
              }
            ]
          }
        }),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("fake-token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)
      const result = await provider.getRates(sampleRequest)

      expect(result).toHaveLength(3)
      expect(result[0].service).toBe("03")
      expect(result[0].amount).toBe(10.50)
      expect(result[1].service).toBe("02")
      expect(result[1].amount).toBe(25.75)
      expect(result[2].service).toBe("01")
      expect(result[2].amount).toBe(45.99)
    })

    it("should correctly parse decimal amounts", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockResolvedValue({
          RateResponse: {
            RatedShipment: [
              {
                Service: { Code: "01" },
                TotalCharges: { MonetaryValue: "123.456", CurrencyCode: "USD" }
              }
            ]
          }
        }),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("fake-token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)
      const result = await provider.getRates(sampleRequest)

      expect(result[0].amount).toBe(123.456)
      expect(typeof result[0].amount).toBe("number")
    })

    it("should handle different currencies", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockResolvedValue({
          RateResponse: {
            RatedShipment: [
              {
                Service: { Code: "11" },
                TotalCharges: { MonetaryValue: "35.50", CurrencyCode: "CAD" }
              }
            ]
          }
        }),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("fake-token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)
      const result = await provider.getRates(sampleRequest)

      expect(result[0].currency).toBe("CAD")
    })
  })

  describe("Request Payload Construction", () => {
    it("should build correct payload from domain models", async () => {
      const mockPost = vi.fn().mockResolvedValue({
        RateResponse: {
          RatedShipment: [
            {
              Service: { Code: "03" },
              TotalCharges: { MonetaryValue: "10.00", CurrencyCode: "USD" }
            }
          ]
        }
      })

      const fakeHttp: HttpClient = {
        post: mockPost,
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("test-token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await provider.getRates(sampleRequest)

      expect(mockPost).toHaveBeenCalledWith(
        "https://test.ups.com/rating",
        {
          RateRequest: {
            Shipment: {
              Shipper: {
                Address: {
                  PostalCode: "10001"
                }
              },
              ShipTo: {
                Address: {
                  PostalCode: "90001"
                }
              },
              Package: [
                {
                  PackageWeight: {
                    Weight: 1
                  }
                }
              ]
            }
          }
        },
        {
          Authorization: "Bearer test-token"
        }
      )
    })

    it("should handle multiple parcels correctly", async () => {
      const mockPost = vi.fn().mockResolvedValue({
        RateResponse: {
          RatedShipment: [
            {
              Service: { Code: "03" },
              TotalCharges: { MonetaryValue: "20.00", CurrencyCode: "USD" }
            }
          ]
        }
      })

      const fakeHttp: HttpClient = {
        post: mockPost,
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("test-token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      const multiParcelRequest: RateRequest = {
        origin: { country: "US", postalCode: "10001", city: "NY" },
        destination: { country: "US", postalCode: "90001", city: "LA" },
        parcels: [
          { weight: 5, length: 10, width: 8, height: 6 },
          { weight: 3, length: 6, width: 4, height: 3 }
        ]
      }

      await provider.getRates(multiParcelRequest)

      const payload = mockPost.mock.calls[0][1] as any
      expect(payload.RateRequest.Shipment.Package).toHaveLength(2)
      expect(payload.RateRequest.Shipment.Package[0].PackageWeight.Weight).toBe(5)
      expect(payload.RateRequest.Shipment.Package[1].PackageWeight.Weight).toBe(3)
    })

    it("should handle international shipment", async () => {
      const mockPost = vi.fn().mockResolvedValue({
        RateResponse: {
          RatedShipment: [
            {
              Service: { Code: "11" },
              TotalCharges: { MonetaryValue: "75.00", CurrencyCode: "USD" }
            }
          ]
        }
      })

      const fakeHttp: HttpClient = {
        post: mockPost,
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("test-token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      const intlRequest: RateRequest = {
        origin: { country: "US", postalCode: "10001", city: "New York" },
        destination: { country: "CA", postalCode: "M5H2N2", city: "Toronto" },
        parcels: [{ weight: 10, length: 12, width: 8, height: 6 }]
      }

      await provider.getRates(intlRequest)

      const payload = mockPost.mock.calls[0][1] as any
      expect(payload.RateRequest.Shipment.Shipper.Address.PostalCode).toBe("10001")
      expect(payload.RateRequest.Shipment.ShipTo.Address.PostalCode).toBe("M5H2N2")
    })
  })

  describe("Auth Token Lifecycle", () => {
    it("should acquire and use auth token", async () => {
      const mockGetToken = vi.fn().mockResolvedValue("acquired-token-xyz")

      const fakeHttp: HttpClient = {
        post: vi.fn().mockResolvedValue({
          RateResponse: {
            RatedShipment: [
              {
                Service: { Code: "03" },
                TotalCharges: { MonetaryValue: "10.00", CurrencyCode: "USD" }
              }
            ]
          }
        }),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: mockGetToken
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)
      await provider.getRates(sampleRequest)

      expect(mockGetToken).toHaveBeenCalledTimes(1)
      expect(fakeHttp.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          Authorization: "Bearer acquired-token-xyz"
        })
      )
    })

    it("should reuse token across multiple calls", async () => {
      const mockGetToken = vi.fn()
        .mockResolvedValueOnce("token-123")
        .mockResolvedValueOnce("token-123")
        .mockResolvedValueOnce("token-123")

      const fakeHttp: HttpClient = {
        post: vi.fn().mockResolvedValue({
          RateResponse: {
            RatedShipment: [
              {
                Service: { Code: "03" },
                TotalCharges: { MonetaryValue: "10.00", CurrencyCode: "USD" }
              }
            ]
          }
        }),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: mockGetToken
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await provider.getRates(sampleRequest)
      await provider.getRates(sampleRequest)
      await provider.getRates(sampleRequest)

      expect(mockGetToken).toHaveBeenCalledTimes(3)
    })

    it("should handle token refresh on expiry", async () => {
      const mockGetToken = vi.fn()
        .mockResolvedValueOnce("expired-token")
        .mockResolvedValueOnce("refreshed-token")

      const mockPost = vi.fn()
        .mockRejectedValueOnce(new Error("HTTP 401: Unauthorized"))
        .mockResolvedValueOnce({
          RateResponse: {
            RatedShipment: [
              {
                Service: { Code: "03" },
                TotalCharges: { MonetaryValue: "10.00", CurrencyCode: "USD" }
              }
            ]
          }
        })

      const fakeHttp: HttpClient = {
        post: mockPost,
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: mockGetToken
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      // First call fails with expired token
      await expect(provider.getRates(sampleRequest)).rejects.toThrow("HTTP 401: Unauthorized")

      // Second call succeeds with refreshed token
      const result = await provider.getRates(sampleRequest)
      expect(result).toHaveLength(1)
      expect(mockGetToken).toHaveBeenCalledTimes(2)
    })
  })

  describe("Error Handling", () => {
    it("should throw CarrierError on malformed response (missing RateResponse)", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await expect(provider.getRates(sampleRequest)).rejects.toThrow(CarrierError)
    })

    it("should throw CarrierError on null RatedShipment", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockResolvedValue({
          RateResponse: {
            RatedShipment: null
          }
        }),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await expect(provider.getRates(sampleRequest)).rejects.toThrow(CarrierError)
    })

    it("should return empty array for empty RatedShipment", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockResolvedValue({
          RateResponse: {
            RatedShipment: []
          }
        }),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)
      const result = await provider.getRates(sampleRequest)

      expect(result).toEqual([])
    })

    it("should handle 400 Bad Request", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockRejectedValue(new Error("HTTP 400: Bad Request - Invalid postal code")),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await expect(provider.getRates(sampleRequest)).rejects.toThrow("HTTP 400")
    })

    it("should handle 401 Unauthorized", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockRejectedValue(new Error("HTTP 401: Unauthorized")),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("invalid-token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await expect(provider.getRates(sampleRequest)).rejects.toThrow("HTTP 401: Unauthorized")
    })

    it("should handle 403 Forbidden", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockRejectedValue(new Error("HTTP 403: Forbidden - Access denied")),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await expect(provider.getRates(sampleRequest)).rejects.toThrow("HTTP 403")
    })

    it("should handle 404 Not Found", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockRejectedValue(new Error("HTTP 404: Not Found")),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await expect(provider.getRates(sampleRequest)).rejects.toThrow("HTTP 404: Not Found")
    })

    it("should handle 500 Internal Server Error", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockRejectedValue(new Error("HTTP 500: Internal Server Error")),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await expect(provider.getRates(sampleRequest)).rejects.toThrow("HTTP 500")
    })

    it("should handle 503 Service Unavailable", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockRejectedValue(new Error("HTTP 503: Service Unavailable")),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await expect(provider.getRates(sampleRequest)).rejects.toThrow("HTTP 503")
    })

    it("should handle network timeout", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockRejectedValue(new Error("Request timeout after 30000ms")),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await expect(provider.getRates(sampleRequest)).rejects.toThrow("timeout")
    })

    it("should handle network connection error", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockRejectedValue(new Error("Network error: ECONNREFUSED")),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await expect(provider.getRates(sampleRequest)).rejects.toThrow("ECONNREFUSED")
    })

    it("should handle malformed JSON response", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token < in JSON at position 0")),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await expect(provider.getRates(sampleRequest)).rejects.toThrow(SyntaxError)
    })

    it("should handle missing required fields in response", async () => {
      const fakeHttp: HttpClient = {
        post: vi.fn().mockResolvedValue({
          RateResponse: {
            RatedShipment: [
              {
                Service: { Code: "03" }
                // Missing TotalCharges
              }
            ]
          }
        }),
        get: vi.fn().mockResolvedValue({})
      }

      const fakeAuth = {
        getToken: vi.fn().mockResolvedValue("token")
      } as unknown as OAuthManager

      const provider = new UpsProvider(fakeHttp, fakeAuth, mockEnv)

      await expect(provider.getRates(sampleRequest)).rejects.toThrow()
    })
  })
})