import { WhatsAppError } from '../types'

export class WhatsAppAuth {
  verifyToken(token: string, expectedToken: string): boolean {
    return token === expectedToken
  }

  validateAccessToken(token: string): void {
    if (!token || token.length < 10) {
      throw new WhatsAppError('Invalid access token format', 'INVALID_TOKEN', 401)
    }
  }

  getAuthHeader(token: string): string {
    this.validateAccessToken(token)
    return `Bearer ${token}`
  }

  async verifyTokenWithApi(token: string): Promise<boolean> {
    try {
      const url = new URL('https://graph.facebook.com/debug_token')
      url.searchParams.set('input_token', token)
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Authorization': this.getAuthHeader(token) },
      })
      const data = await response.json()
      return response.ok && (data as any)?.data?.is_valid === true
    } catch {
      return false
    }
  }
}
