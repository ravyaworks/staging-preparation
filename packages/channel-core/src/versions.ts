import type { ChannelType } from './types'

export interface VersionInfo {
  version: string
  channelType: ChannelType
  supported: boolean
  deprecated?: boolean
  deprecationMessage?: string
  releasedAt: string
  minApiVersion?: string
}

export class VersionRegistry {
  private versions = new Map<string, VersionInfo>()

  register(info: VersionInfo): void {
    const key = `${info.channelType}:${info.version}`
    this.versions.set(key, info)
  }

  get(channelType: ChannelType, version: string): VersionInfo | undefined {
    return this.versions.get(`${channelType}:${version}`)
  }

  getLatest(channelType: ChannelType): VersionInfo | undefined {
    const channelVersions = this.listForChannel(channelType)
    if (channelVersions.length === 0) return undefined
    return channelVersions.sort((a, b) => b.version.localeCompare(a.version))[0]
  }

  listForChannel(channelType: ChannelType): VersionInfo[] {
    return Array.from(this.versions.values())
      .filter(v => v.channelType === channelType)
      .sort((a, b) => b.version.localeCompare(a.version))
  }

  listSupported(channelType: ChannelType): VersionInfo[] {
    return this.listForChannel(channelType).filter(v => v.supported && !v.deprecated)
  }

  isSupported(channelType: ChannelType, version: string): boolean {
    const info = this.get(channelType, version)
    if (!info) return false
    return info.supported && !info.deprecated
  }

  unregister(channelType: ChannelType, version: string): boolean {
    return this.versions.delete(`${channelType}:${version}`)
  }

  clear(): void {
    this.versions.clear()
  }
}
