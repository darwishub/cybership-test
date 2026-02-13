import { CarrierError } from "@/domain/errors/appError"
import { HttpClient } from "./httpClient"

export class FetchHttpClient implements HttpClient {

  async post<T = unknown>(
    url: string,
    body: unknown,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 8000)

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
        signal: controller.signal
      })

      const text = await res.text()

      if (!res.ok)
        throw new CarrierError(`HTTP_${res.status}: ${text}`)

      return JSON.parse(text) as T

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError")
        throw new CarrierError("Carrier timeout")

      throw err
    }
  }

  async get<T = unknown>(
    url: string,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 8000)

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...headers },
        signal: controller.signal
      })

      const text = await res.text()

      if (!res.ok)
        throw new CarrierError(`HTTP_${res.status}: ${text}`)

      return JSON.parse(text) as T

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError")
        throw new CarrierError("Carrier timeout")

      throw err
    }
  }
}
