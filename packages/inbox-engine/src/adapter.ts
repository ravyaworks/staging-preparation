import type { IncomingChannelAdapter } from './types';

export type { IncomingChannelAdapter };

export function createChannelAdapter(
  adapter: IncomingChannelAdapter,
): IncomingChannelAdapter {
  return adapter;
}
