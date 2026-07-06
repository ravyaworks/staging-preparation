import type { LogLevel } from '@conversation-platform/types';

export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  fatal(...args: unknown[]): void;
  child(context: Record<string, unknown>): Logger;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}

export type LoggerFactory = (name: string, context?: Record<string, unknown>) => Logger;
