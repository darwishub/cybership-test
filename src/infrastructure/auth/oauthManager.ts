import { HttpClient } from "@/infrastructure/http/httpClient"

export interface OAuthConfig {
  tokenUrl: string
  clientId: string
  clientSecret: string
  grantType?: string
  expiryBufferMs?: number
}

export interface OAuthTokenResponse {
  access_token: string
  expires_in: number
}

export class OAuthManager {
  private token?: string
  private exp = 0
  private readonly grantType: string
  private readonly expiryBufferMs: number

  constructor(
    private http: HttpClient,
    private config: OAuthConfig
  ) {
    this.grantType = config.grantType || "client_credentials"
    this.expiryBufferMs = config.expiryBufferMs || 5 * 60 * 1000 // 5 minutes default
  }

  async getToken(): Promise<string> {
    // Return cached token if still valid
    if (this.token && Date.now() < this.exp) {
      return this.token
    }

    // Request new token
    const body = `grant_type=${this.grantType}`
    const authHeader = "Basic " +
      Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`)
        .toString("base64")

    const res = await this.http.post<OAuthTokenResponse>(
      this.config.tokenUrl,
      body,
      {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    )

    // Cache token with expiry buffer
    this.token = res.access_token
    this.exp = Date.now() + (res.expires_in * 1000) - this.expiryBufferMs

    return this.token
  }
}
