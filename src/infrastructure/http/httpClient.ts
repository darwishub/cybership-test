export interface HttpClient {
  post<T = unknown>(
    url: string, 
    body: unknown, 
    headers?: Record<string, string>
  ): Promise<T>
  
  get<T = unknown>(
    url: string,
    headers?: Record<string, string>
  ): Promise<T>
}
