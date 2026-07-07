import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: '.',
    include: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['node_modules', 'dist', '.next', 'out'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['packages/*/src/**/*.ts', 'apps/*/src/**/*.ts'],
      exclude: ['**/*.{test,spec}.ts', '**/index.ts', '**/types/**', 'node_modules', 'dist'],
      thresholds: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
    },
    reporters: ['default', 'verbose'],
    testTimeout: 10000,
    hookTimeout: 10000,
    retry: 0,
  },
  resolve: {
    alias: {
      '@conversation-platform/types': path.resolve(__dirname, 'packages/types/src'),
      '@conversation-platform/logger': path.resolve(__dirname, 'packages/logger/src'),
      '@conversation-platform/config': path.resolve(__dirname, 'packages/config/src'),
      '@conversation-platform/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@conversation-platform/testing': path.resolve(__dirname, 'packages/testing/src'),
      '@conversation-platform/database': path.resolve(__dirname, 'packages/database/src'),
      '@conversation-platform/auth': path.resolve(__dirname, 'packages/auth/src'),
      '@conversation-platform/queue': path.resolve(__dirname, 'packages/queue/src'),
      '@conversation-platform/event-bus': path.resolve(__dirname, 'packages/event-bus/src'),
      '@conversation-platform/storage': path.resolve(__dirname, 'packages/storage/src'),
    },
  },
});
