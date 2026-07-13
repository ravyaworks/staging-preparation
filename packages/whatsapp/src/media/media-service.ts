import type { Logger } from '@conversation-platform/logger'
import type { WhatsAppConfig } from '../types'
import { WhatsAppError } from '../types'
import { WhatsAppApiClient } from '../client/whatsapp-api-client'
import { WhatsAppValidator } from '../validation/whatsapp-validator'

export class MediaService {
  constructor(
    private readonly client: WhatsAppApiClient,
    private readonly config: WhatsAppConfig,
    private readonly logger: Logger,
  ) {}

  async uploadMedia(filePath: string, mimeType: string): Promise<{ id: string; url?: string }> {
    const response = await this.client.uploadMedia(filePath, mimeType) as { id?: string }
    if (!response.id) {
      throw new WhatsAppError('Media upload returned no ID', 'MEDIA_UPLOAD_NO_ID', 500)
    }
    this.logger.info({ mediaId: response.id, mimeType }, 'Media uploaded successfully')
    return response as { id: string; url?: string }
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    return this.client.downloadMediaUrl(mediaId)
  }

  async sendImage(recipientPhone: string, mediaId: string, caption?: string): Promise<unknown> {
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone.replace('+', ''),
      type: 'image',
      image: { id: mediaId },
    }
    if (caption) { (body.image as Record<string, unknown>).caption = caption }

    return this.client.sendMessage(body)
  }

  async sendDocument(recipientPhone: string, mediaId: string, filename?: string, caption?: string): Promise<unknown> {
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone.replace('+', ''),
      type: 'document',
      document: { id: mediaId },
    }
    if (filename) { (body.document as Record<string, unknown>).filename = filename }
    if (caption) { (body.document as Record<string, unknown>).caption = caption }

    return this.client.sendMessage(body)
  }

  async sendVideo(recipientPhone: string, mediaId: string, caption?: string): Promise<unknown> {
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone.replace('+', ''),
      type: 'video',
      video: { id: mediaId },
    }
    if (caption) { (body.video as Record<string, unknown>).caption = caption }

    return this.client.sendMessage(body)
  }

  async sendAudio(recipientPhone: string, mediaId: string): Promise<unknown> {
    return this.client.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone.replace('+', ''),
      type: 'audio',
      audio: { id: mediaId },
    })
  }
}
