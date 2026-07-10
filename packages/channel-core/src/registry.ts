import type { ChannelInterface, ChannelType, ChannelRegistration, ChannelListOptions, ChannelStatus } from './types'

export class ChannelRegistry {
  private channels = new Map<string, ChannelRegistration>()
  private channelImplementations = new Map<ChannelType, ChannelInterface>()

  register(type: ChannelType, implementation: ChannelInterface): void {
    if (this.channelImplementations.has(type)) {
      throw new Error(`Channel implementation for '${type}' is already registered`)
    }
    this.channelImplementations.set(type, implementation)
  }

  getImplementation(type: ChannelType): ChannelInterface {
    const impl = this.channelImplementations.get(type)
    if (!impl) {
      throw new Error(`No channel implementation registered for '${type}'`)
    }
    return impl
  }

  hasImplementation(type: ChannelType): boolean {
    return this.channelImplementations.has(type)
  }

  listImplementations(): ChannelType[] {
    return Array.from(this.channelImplementations.keys())
  }

  getImplementations(): Map<ChannelType, ChannelInterface> {
    return new Map(this.channelImplementations)
  }

  unregisterImplementation(type: ChannelType): boolean {
    return this.channelImplementations.delete(type)
  }

  connect(tenantId: string, type: ChannelType, registration: ChannelRegistration): void {
    const key = this.buildKey(tenantId, type)
    this.channels.set(key, registration)
  }

  disconnect(tenantId: string, type: ChannelType): boolean {
    return this.channels.delete(this.buildKey(tenantId, type))
  }

  get(tenantId: string, type: ChannelType): ChannelRegistration | undefined {
    return this.channels.get(this.buildKey(tenantId, type))
  }

  getByTenant(tenantId: string): ChannelRegistration[] {
    const results: ChannelRegistration[] = []
    for (const [key, reg] of this.channels) {
      if (key.startsWith(`${tenantId}:`)) {
        results.push(reg)
      }
    }
    return results
  }

  getByType(type: ChannelType): ChannelRegistration[] {
    const results: ChannelRegistration[] = []
    for (const [, reg] of this.channels) {
      if (reg.channel.type === type) {
        results.push(reg)
      }
    }
    return results
  }

  list(options?: ChannelListOptions): ChannelRegistration[] {
    let results = Array.from(this.channels.values())
    if (options) {
      if (options.status) {
        results = results.filter(r => r.status === options.status)
      }
      if (options.type) {
        results = results.filter(r => r.channel.type === options.type)
      }
      if (options.tenantId) {
        results = results.filter(r => r.tenantId === options.tenantId)
      }
    }
    return results
  }

  updateStatus(tenantId: string, type: ChannelType, status: ChannelStatus): void {
    const key = this.buildKey(tenantId, type)
    const reg = this.channels.get(key)
    if (reg) {
      reg.status = status
    }
  }

  clear(): void {
    this.channels.clear()
  }

  count(): number {
    return this.channels.size
  }

  countByTenant(tenantId: string): number {
    return this.getByTenant(tenantId).length
  }

  private buildKey(tenantId: string, type: ChannelType): string {
    return `${tenantId}:${type}`
  }
}
