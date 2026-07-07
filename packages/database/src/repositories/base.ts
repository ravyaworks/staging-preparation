import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  protected async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw error;
    }
  }
}
