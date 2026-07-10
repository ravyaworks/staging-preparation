const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

interface ApiError {
  status: number
  message: string
  code?: string
  details?: Record<string, string[]>
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: 'An unexpected error occurred',
    }
    try {
      const body = await response.json()
      error.message = body.message || body.error || error.message
      error.code = body.code
      error.details = body.details
    } catch {
      error.message = response.statusText || error.message
    }
    throw error
  }
  return response.json() as Promise<T>
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url.toString()
}

export const api = {
  async get<T>(path: string, options?: ApiOptions): Promise<T> {
    const response = await fetch(buildUrl(path, options?.params), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })
    return handleResponse<T>(response)
  },

  async post<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
    const response = await fetch(buildUrl(path, options?.params), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })
    return handleResponse<T>(response)
  },

  async put<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
    const response = await fetch(buildUrl(path, options?.params), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })
    return handleResponse<T>(response)
  },

  async patch<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
    const response = await fetch(buildUrl(path, options?.params), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })
    return handleResponse<T>(response)
  },

  async delete<T>(path: string, options?: ApiOptions): Promise<T> {
    const response = await fetch(buildUrl(path, options?.params), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })
    return handleResponse<T>(response)
  },
}

export type { ApiOptions, ApiError }
