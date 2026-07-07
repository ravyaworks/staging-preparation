import { loadConfig } from '@conversation-platform/config';
import { createPrismaClient, disconnectPrisma } from '@conversation-platform/database';
import { createPinoLogger } from './lib/logger';
import { createApp } from './app';

async function main() {
  const config = loadConfig();
  const logger = createPinoLogger('api', { level: config.log.level, pretty: config.log.pretty });

  try {
    const prisma = createPrismaClient();
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.fatal('Failed to connect to database', error);
    process.exit(1);
  }

  const app = createApp(config, logger);

  const server = app.listen(config.port, config.host, () => {
    logger.info(`API server listening on http://${config.host}:${config.port}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectPrisma();
      logger.info('Server shut down');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
