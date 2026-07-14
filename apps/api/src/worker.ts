import { loadConfig } from '@conversation-platform/config';
import { createPrismaClient, disconnectPrisma } from '@conversation-platform/database';
import { createPinoLogger } from './lib/logger';
import { QueueServiceImplementation, InMemoryQueueAdapter } from '@conversation-platform/queue';
import type { Logger } from '@conversation-platform/logger';

async function main() {
  const config = loadConfig();
  const logger = createPinoLogger('worker', { level: config.log.level, pretty: config.log.pretty });

  try {
    const prisma = createPrismaClient();
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.fatal('Failed to connect to database', error);
    process.exit(1);
  }

  const adapter = new InMemoryQueueAdapter();
  const queue = new QueueServiceImplementation(adapter);

  logger.info('Worker started, listening for jobs...');
  await queue.start();

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    await queue.stop();
    await disconnectPrisma();
    logger.info('Worker shut down');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Failed to start worker:', error);
  process.exit(1);
});
