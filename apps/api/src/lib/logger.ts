import pino from 'pino';
import type { Logger } from '@conversation-platform/logger';

export function createPinoLogger(name: string, options?: { level?: string; pretty?: boolean }): Logger {
  const transport = options?.pretty
    ? { target: 'pino/file', options: { colorize: true } }
    : undefined;

  const logger = pino({
    name,
    level: options?.level ?? 'info',
    transport,
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
    },
  });

  return {
    debug: (...args: unknown[]) => logger.debug(args.length === 1 ? args[0] : args),
    info: (...args: unknown[]) => logger.info(args.length === 1 ? args[0] : args),
    warn: (...args: unknown[]) => logger.warn(args.length === 1 ? args[0] : args),
    error: (...args: unknown[]) => logger.error(args.length === 1 ? args[0] : args),
    fatal: (...args: unknown[]) => logger.fatal(args.length === 1 ? args[0] : args),
    child: (context: Record<string, unknown>) => {
      const child = logger.child(context);
      return {
        debug: (...args: unknown[]) => child.debug(args.length === 1 ? args[0] : args),
        info: (...args: unknown[]) => child.info(args.length === 1 ? args[0] : args),
        warn: (...args: unknown[]) => child.warn(args.length === 1 ? args[0] : args),
        error: (...args: unknown[]) => child.error(args.length === 1 ? args[0] : args),
        fatal: (...args: unknown[]) => child.fatal(args.length === 1 ? args[0] : args),
        child: (ctx: Record<string, unknown>) => child.child(ctx) as unknown as Logger,
        setLevel: (lvl: string) => { child.level = lvl; },
        getLevel: () => child.level as 'debug' | 'info' | 'warn' | 'error' | 'fatal',
      };
    },
    setLevel: (level: string) => { logger.level = level; },
    getLevel: () => logger.level as 'debug' | 'info' | 'warn' | 'error' | 'fatal',
  };
}
