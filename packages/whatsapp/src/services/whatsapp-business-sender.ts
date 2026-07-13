import type { Logger } from '@conversation-platform/logger'
import type { WhatsAppConfig, WhatsAppSenderResult, MessageStatus } from '../types'
import { WhatsAppError } from '../types'
import { WhatsAppApiClient } from '../client/whatsapp-api-client'
import { WhatsAppValidator } from '../validation/whatsapp-validator'
import { WhatsAppAuth } from '../auth/whatsapp-auth'

const SENDER_NAME = 'whatsapp-business-platform'

export class WhatsAppBusinessSender {
  public readonly name = SENDER_NAME
  public readonly channel = 'whatsapp'

  private readonly client: WhatsAppApiClient
  private readonly validator: WhatsAppValidator
  private readonly auth: WhatsAppAuth

  constructor(
    private readonly config: WhatsAppConfig,
    private readonly logger: Logger,
  ) {
    this.client = new WhatsAppApiClient(config, logger)
    this.validator = new WhatsAppValidator()
    this.auth = new WhatsAppAuth()
  }

  async send(
    recipientPhone: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<WhatsAppSenderResult> {
    const startTime = Date.now()
    let phone: string | undefined

    try {
      phone = this.validator.validatePhoneNumber(recipientPhone)
      this.validator.validateMessageBody(message)

      const useTemplate = metadata?.templateName !== undefined

      let response: unknown

      if (useTemplate) {
        response = await this.sendTemplateMessage(phone, message, metadata!)
      } else {
        response = await this.sendTextMessage(phone, message)
      }

      const resp = response as { messages?: Array<{ id: string }> }
      const messageId = resp?.messages?.[0]?.id

      const elapsed = Date.now() - startTime
      this.logger.info(
        { recipientPhone: phone, messageId, elapsed, useTemplate },
        'WhatsApp message sent successfully',
      )

      return {
        success: true,
        messageId,
        waId: phone,
        status: 'accepted',
        metadata: {
          channel: 'whatsapp',
          sender: SENDER_NAME,
          elapsedMs: elapsed,
          useTemplate,
          ...metadata,
        },
      }
    } catch (error) {
      const elapsed = Date.now() - startTime
      const errorMessage = error instanceof WhatsAppError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unknown WhatsApp error'

      const errorCode = error instanceof WhatsAppError ? error.code : 'UNKNOWN'

      this.logger.error(
        { recipientPhone: phone ?? recipientPhone, errorCode, errorMessage, elapsed },
        'WhatsApp message send failed',
      )

      return {
        success: false,
        error: errorMessage,
        metadata: {
          channel: 'whatsapp',
          sender: SENDER_NAME,
          errorCode,
          elapsedMs: elapsed,
          ...metadata,
        },
      }
    }
  }

  private async sendTextMessage(to: string, text: string): Promise<unknown> {
    return this.client.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace('+', ''),
      type: 'text',
      text: { preview_url: false, body: text },
    })
  }

  private async sendTemplateMessage(
    to: string,
    _message: string,
    metadata: Record<string, unknown>,
  ): Promise<unknown> {
    const templateName = metadata.templateName as string
    const templateLanguage = (metadata.templateLanguage as string) ?? 'en_US'
    const templateVariables = (metadata.templateVariables as Record<string, string>) ?? {}

    const components: Array<Record<string, unknown>> = []

    if (Object.keys(templateVariables).length > 0) {
      const params = Object.values(templateVariables).map(value => ({
        type: 'text' as const,
        text: value,
      }))
      components.push({
        type: 'body',
        parameters: params,
      })
    }

    return this.client.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace('+', ''),
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: components.length > 0 ? components : undefined,
      },
    })
  }

  async sendImage(
    recipientPhone: string,
    imageIdOrUrl: string,
    caption?: string,
  ): Promise<WhatsAppSenderResult> {
    try {
      const phone = this.validator.validatePhoneNumber(recipientPhone)
      const body: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone.replace('+', ''),
        type: 'image',
        image: { id: imageIdOrUrl },
      }
      if (caption) { (body.image as Record<string, unknown>).caption = caption }

      const response = await this.client.sendMessage(body) as { messages?: Array<{ id: string }> }
      return {
        success: true,
        messageId: response?.messages?.[0]?.id,
        waId: phone,
        status: 'accepted',
        metadata: { channel: 'whatsapp', sender: SENDER_NAME, mediaType: 'image' },
      }
    } catch (error) {
      return this.handleSendError(error)
    }
  }

  async sendDocument(
    recipientPhone: string,
    documentIdOrUrl: string,
    filename?: string,
    caption?: string,
  ): Promise<WhatsAppSenderResult> {
    try {
      const phone = this.validator.validatePhoneNumber(recipientPhone)
      const body: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone.replace('+', ''),
        type: 'document',
        document: { id: documentIdOrUrl },
      }
      if (filename) { (body.document as Record<string, unknown>).filename = filename }
      if (caption) { (body.document as Record<string, unknown>).caption = caption }

      const response = await this.client.sendMessage(body) as { messages?: Array<{ id: string }> }
      return {
        success: true,
        messageId: response?.messages?.[0]?.id,
        waId: phone,
        status: 'accepted',
        metadata: { channel: 'whatsapp', sender: SENDER_NAME, mediaType: 'document' },
      }
    } catch (error) {
      return this.handleSendError(error)
    }
  }

  async sendVideo(
    recipientPhone: string,
    videoIdOrUrl: string,
    caption?: string,
  ): Promise<WhatsAppSenderResult> {
    try {
      const phone = this.validator.validatePhoneNumber(recipientPhone)
      const body: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone.replace('+', ''),
        type: 'video',
        video: { id: videoIdOrUrl },
      }
      if (caption) { (body.video as Record<string, unknown>).caption = caption }

      const response = await this.client.sendMessage(body) as { messages?: Array<{ id: string }> }
      return {
        success: true,
        messageId: response?.messages?.[0]?.id,
        waId: phone,
        status: 'accepted',
        metadata: { channel: 'whatsapp', sender: SENDER_NAME, mediaType: 'video' },
      }
    } catch (error) {
      return this.handleSendError(error)
    }
  }

  async sendAudio(
    recipientPhone: string,
    audioIdOrUrl: string,
  ): Promise<WhatsAppSenderResult> {
    try {
      const phone = this.validator.validatePhoneNumber(recipientPhone)
      const response = await this.client.sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone.replace('+', ''),
        type: 'audio',
        audio: { id: audioIdOrUrl },
      }) as { messages?: Array<{ id: string }> }

      return {
        success: true,
        messageId: response?.messages?.[0]?.id,
        waId: phone,
        status: 'accepted',
        metadata: { channel: 'whatsapp', sender: SENDER_NAME, mediaType: 'audio' },
      }
    } catch (error) {
      return this.handleSendError(error)
    }
  }

  async sendInteractive(
    recipientPhone: string,
    interactiveBody: Record<string, unknown>,
  ): Promise<WhatsAppSenderResult> {
    try {
      const phone = this.validator.validatePhoneNumber(recipientPhone)
      const response = await this.client.sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone.replace('+', ''),
        type: 'interactive',
        interactive: interactiveBody,
      }) as { messages?: Array<{ id: string }> }

      return {
        success: true,
        messageId: response?.messages?.[0]?.id,
        waId: phone,
        status: 'accepted',
        metadata: { channel: 'whatsapp', sender: SENDER_NAME, mediaType: 'interactive' },
      }
    } catch (error) {
      return this.handleSendError(error)
    }
  }

  getClient(): WhatsAppApiClient {
    return this.client
  }

  getValidator(): WhatsAppValidator {
    return this.validator
  }

  getConfig(): WhatsAppConfig {
    return this.config
  }

  private handleSendError(error: unknown): WhatsAppSenderResult {
    const errorMessage = error instanceof WhatsAppError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Unknown WhatsApp error'

    const errorCode = error instanceof WhatsAppError ? error.code : 'UNKNOWN'

    this.logger.error({ errorCode, errorMessage }, 'WhatsApp send operation failed')

    return {
      success: false,
      error: errorMessage,
      metadata: { channel: 'whatsapp', sender: SENDER_NAME, errorCode },
    }
  }
}
