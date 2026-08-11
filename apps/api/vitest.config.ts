import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@danta/schemas': path.resolve(__dirname, '../../packages/schemas/src'),
      '@danta/database': path.resolve(__dirname, '../../packages/database/src'),
      '@danta/permissions': path.resolve(__dirname, '../../packages/permissions/src'),
      '@danta/auth': path.resolve(__dirname, '../../packages/auth/src'),
      '@danta/config': path.resolve(__dirname, '../../packages/config/src'),
      '@danta/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
});
