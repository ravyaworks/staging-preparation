import type { Logger } from '@conversation-platform/logger'
import type { WhatsAppConfig } from '../types'
import { WhatsAppError } from '../types'
import { getWhatsAppApiUrl, getBusinessAccountUrl } from '../config'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  path: string
  body?: Record<string, unknown>
  params?: Record<string, string>
  timeout?: number
  isBusinessApi?: boolean
}

interface RetryableResponse {
  ok: boolean
  status: number
  data: unknown
}

export class WhatsAppApiClient {
  private readonly baseUrl: string
  private readonly businessUrl: string

  constructor(
    private readonly config: WhatsAppConfig,
    private readonly logger: Logger,
  ) {
    this.baseUrl = getWhatsAppApiUrl(config)
    this.businessUrl = getBusinessAccountUrl(config)
  }

  async request<T = unknown>(options: RequestOptions): Promise<T> {
    const { method = 'POST', path, body, params, timeout, isBusinessApi } = options
    const base = isBusinessApi ? this.businessUrl : this.baseUrl
    const url = new URL(`${base}${path}`)

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value)
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout ?? this.config.requestTimeoutMs)

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1)
          this.logger.debug({ attempt, delay }, 'WhatsApp API retry')
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const response = await fetch(url.toString(), {
          method,
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') ?? '5', 10)
          this.logger.warn({ retryAfter }, 'WhatsApp rate limited')
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
          continue
        }

        const data = await response.json()

        if (!response.ok) {
          const fbTraceId = (data as any)?.error?.fbtrace_id
          const errorCode = (data as any)?.error?.code ?? response.status
          const errorMsg = (data as any)?.error?.message ?? response.statusText

          if (response.status >= 500 && attempt < this.config.maxRetries) {
            lastError = new WhatsAppError(errorMsg, String(errorCode), response.status, fbTraceId)
            continue
          }

          throw new WhatsAppError(errorMsg, String(errorCode), response.status, fbTraceId, data)
        }

        return data as T
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof WhatsAppError) throw error

        if (error instanceof Error && error.name === 'AbortError') {
          throw new WhatsAppError('Request timeout', 'TIMEOUT', 408)
        }

        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt < this.config.maxRetries) continue
        throw new WhatsAppError(
          lastError.message,
          'NETWORK_ERROR',
          503,
          undefined,
          lastError,
        )
      }
    }

    throw lastError ?? new WhatsAppError('Request failed after retries', 'MAX_RETRIES', 503)
  }

  async sendMessage(body: Record<string, unknown>): Promise<unknown> {
    return this.request({
      method: 'POST',
      path: '/messages',
      body,
    })
  }

  async getTemplates(params?: Record<string, string>): Promise<unknown> {
    return this.request({
      method: 'GET',
      path: '/message_templates',
      params: { ...params, limit: params?.limit ?? '50' },
      isBusinessApi: true,
    })
  }

  async uploadMedia(filePath: string, mimeType: string): Promise<unknown> {
    const formData = new FormData()
    const blob = await this.filePathToBlob(filePath, mimeType)
    formData.append('file', blob, 'file')
    formData.append('type', mimeType)

    const url = `${this.baseUrl}/media`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeoutMs)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const data = await response.json()
        throw new WhatsAppError(
          (data as any)?.error?.message ?? 'Media upload failed',
          String((data as any)?.error?.code ?? response.status),
          response.status,
        )
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof WhatsAppError) throw error
      throw new WhatsAppError('Media upload failed', 'MEDIA_UPLOAD_ERROR', 500)
    }
  }

  async downloadMediaUrl(mediaId: string): Promise<string> {
    const data = await this.request<{ url?: string }>({
      method: 'GET',
      path: `/media/${mediaId}`,
    })
    return data.url ?? ''
  }

  async verifyWebhook(
    mode: string,
    token: string,
    challenge: string,
  ): Promise<string | null> {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      return challenge
    }
    return null
  }

  private async filePathToBlob(_filePath: string, _mimeType: string): Promise<Blob> {
    const { readFile } = await import('fs/promises')
    const buffer = await readFile(_filePath)
    return new Blob([buffer], { type: _mimeType })
  }
}
