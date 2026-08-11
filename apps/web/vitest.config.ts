import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@danta/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@danta/schemas': path.resolve(__dirname, '../../packages/schemas/src'),
    },
  },
});
