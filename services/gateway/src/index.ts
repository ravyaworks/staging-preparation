import type { AppConfig } from '@conversation-platform/config'
import type { Logger } from '@conversation-platform/logger'

export interface GatewayRoute {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  target: string
  rateLimit?: { windowMs: number; maxRequests: number }
}

export interface GatewayService {
  registerRoute(route: GatewayRoute): void
  getRoutes(): GatewayRoute[]
}

export function createGatewayService(config: AppConfig, logger: Logger): GatewayService {
  const routes: GatewayRoute[] = []

  return {
    registerRoute(route: GatewayRoute): void {
      routes.push(route)
      logger.info({ path: route.path, method: route.method, target: route.target }, 'Gateway route registered')
    },

    getRoutes(): GatewayRoute[] {
      return [...routes]
    },
  }
}
