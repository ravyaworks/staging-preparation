import type { Logger } from '@conversation-platform/logger'
import type { WhatsAppConfig, WhatsAppTemplate, TemplateStatus, TemplateCategory, TemplateComponent } from '../types'
import { WhatsAppError } from '../types'
import { WhatsAppApiClient } from '../client/whatsapp-api-client'

export class TemplateService {
  constructor(
    private readonly client: WhatsAppApiClient,
    private readonly config: WhatsAppConfig,
    private readonly logger: Logger,
  ) {}

  async syncTemplates(): Promise<WhatsAppTemplate[]> {
    this.logger.info('Syncing WhatsApp templates from Business Account')

    const allTemplates: WhatsAppTemplate[] = []
    let cursor: string | undefined

    do {
      const params: Record<string, string> = {
        fields: 'id,name,language,category,status,components,created_time,updated_time',
        limit: '50',
      }
      if (cursor) params['after'] = cursor

      const response = await this.client.getTemplates(params) as {
        data?: WhatsAppTemplate[]
        paging?: { cursors?: { after?: string }; next?: string }
      }

      if (response.data) {
        allTemplates.push(...response.data)
      }

      cursor = response.paging?.cursors?.after
      if (!response.paging?.next) cursor = undefined
    } while (cursor)

    this.logger.info({ count: allTemplates.length }, 'Templates synced successfully')
    return allTemplates
  }

  async getTemplate(name: string): Promise<WhatsAppTemplate | null> {
    const templates = await this.client.getTemplates({
      fields: 'id,name,language,category,status,components,created_time,updated_time',
      name,
      limit: '1',
    }) as { data?: WhatsAppTemplate[] }

    return templates.data?.[0] ?? null
  }

  async getTemplateById(id: string): Promise<WhatsAppTemplate | null> {
    try {
      const data = await this.client.request<WhatsAppTemplate>({
        method: 'GET',
        path: `/${id}`,
        params: {
          fields: 'id,name,language,category,status,components,created_time,updated_time',
        },
        isBusinessApi: true,
      })
      return data
    } catch {
      return null
    }
  }

  async createTemplate(
    name: string,
    language: string,
    category: TemplateCategory,
    components: TemplateComponent[],
  ): Promise<WhatsAppTemplate> {
    this.logger.info({ name, language, category }, 'Creating WhatsApp template')

    const response = await this.client.request<WhatsAppTemplate>({
      method: 'POST',
      path: '/message_templates',
      body: {
        name,
        language,
        category,
        components,
      },
      isBusinessApi: true,
    })

    return response
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      await this.client.request({
        method: 'DELETE',
        path: `/${templateId}`,
        isBusinessApi: true,
      })
      this.logger.info({ templateId }, 'Template deleted')
      return true
    } catch (error) {
      this.logger.error({ templateId, error }, 'Failed to delete template')
      return false
    }
  }

  async getTemplateStatus(name: string): Promise<TemplateStatus | null> {
    const template = await this.getTemplate(name)
    return template?.status ?? null
  }
}
