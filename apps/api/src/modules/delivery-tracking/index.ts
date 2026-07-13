import { Router } from 'express'
import type { AppConfig } from '@conversation-platform/config'
import type { Logger } from '@conversation-platform/logger'
import { createDeliveryTrackingRoutes } from './modules/delivery-tracking/routes'

export function createDeliveryTrackingModule(config: AppConfig, logger: Logger): { router: Router } {
  const router = createDeliveryTrackingRoutes(config, logger)
  return { router }
}
