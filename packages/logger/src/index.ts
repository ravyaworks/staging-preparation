import type { LogLevel } from '@conversation-platform/types';
import pino from 'pino';

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

const logLevelMap: Record<LogLevel, pino.Level> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'fatal',
};

export class PinoLogger implements Logger {
  private logger: pino.Logger;

  constructor(name: string, options?: { level?: LogLevel; pretty?: boolean; context?: Record<string, unknown> }) {
    const transport = options?.pretty
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined;

    this.logger = pino({
      name,
      level: options?.level ? logLevelMap[options.level] : 'info',
      transport,
      base: options?.context,
    });
  }

  debug(...args: unknown[]): void {
    if (args.length === 2 && typeof args[0] === 'object' && typeof args[1] === 'string') {
      this.logger.debug(args[0] as Record<string, unknown>, args[1] as string);
    } else if (args.length === 1 && typeof args[0] === 'string') {
      this.logger.debug(args[0] as string);
    } else {
      this.logger.debug(args);
    }
  }

  info(...args: unknown[]): void {
    if (args.length === 2 && typeof args[0] === 'object' && typeof args[1] === 'string') {
      this.logger.info(args[0] as Record<string, unknown>, args[1] as string);
    } else if (args.length === 1 && typeof args[0] === 'string') {
      this.logger.info(args[0] as string);
    } else {
      this.logger.info(args);
    }
  }

  warn(...args: unknown[]): void {
    if (args.length === 2 && typeof args[0] === 'object' && typeof args[1] === 'string') {
      this.logger.warn(args[0] as Record<string, unknown>, args[1] as string);
    } else if (args.length === 1 && typeof args[0] === 'string') {
      this.logger.warn(args[0] as string);
    } else {
      this.logger.warn(args);
    }
  }

  error(...args: unknown[]): void {
    if (args.length === 2 && typeof args[0] === 'object' && typeof args[1] === 'string') {
      this.logger.error(args[0] as Record<string, unknown>, args[1] as string);
    } else if (args.length === 1 && typeof args[0] === 'string') {
      this.logger.error(args[0] as string);
    } else {
      this.logger.error(args);
    }
  }

  fatal(...args: unknown[]): void {
    if (args.length === 2 && typeof args[0] === 'object' && typeof args[1] === 'string') {
      this.logger.fatal(args[0] as Record<string, unknown>, args[1] as string);
    } else if (args.length === 1 && typeof args[0] === 'string') {
      this.logger.fatal(args[0] as string);
    } else {
      this.logger.fatal(args);
    }
  }

  child(context: Record<string, unknown>): Logger {
    const childLogger = new PinoLogger('child', { level: this.getLevel() });
    (childLogger as any).logger = this.logger.child(context);
    return childLogger;
  }

  setLevel(level: LogLevel): void {
    this.logger.level = logLevelMap[level];
  }

  getLevel(): LogLevel {
    const level = this.logger.level as pino.Level;
    const entry = Object.entries(logLevelMap).find(([, v]) => v === level);
    return (entry?.[0] as LogLevel) ?? 'info';
  }
}
