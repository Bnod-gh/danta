import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.spec.tsx', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: [
      { find: '@danta/ui/card', replacement: path.resolve(__dirname, '../../packages/ui/src/components/ui/card.tsx') },
      { find: '@danta/ui/button', replacement: path.resolve(__dirname, '../../packages/ui/src/components/ui/button.tsx') },
      { find: '@danta/ui/skeleton', replacement: path.resolve(__dirname, '../../packages/ui/src/components/ui/skeleton.tsx') },
      { find: '@danta/ui/badge', replacement: path.resolve(__dirname, '../../packages/ui/src/components/ui/badge.tsx') },
      { find: '@danta/ui/dialog', replacement: path.resolve(__dirname, '../../packages/ui/src/components/ui/dialog.tsx') },
      { find: '@danta/ui/popover', replacement: path.resolve(__dirname, '../../packages/ui/src/components/ui/popover.tsx') },
      { find: '@danta/ui/scroll-area', replacement: path.resolve(__dirname, '../../packages/ui/src/components/ui/scroll-area.tsx') },
      { find: '@danta/ui/command', replacement: path.resolve(__dirname, '../../packages/ui/src/components/ui/command.tsx') },
      { find: '@danta/ui/label', replacement: path.resolve(__dirname, '../../packages/ui/src/components/ui/label.tsx') },
      { find: '@danta/ui/select', replacement: path.resolve(__dirname, '../../packages/ui/src/components/ui/select.tsx') },
      { find: '@danta/ui/input', replacement: path.resolve(__dirname, '../../packages/ui/src/components/ui/input.tsx') },
      { find: '@danta/ui/utils', replacement: path.resolve(__dirname, '../../packages/ui/src/utils.ts') },
      { find: '@danta/ui', replacement: path.resolve(__dirname, '../../packages/ui/src') },
      { find: '@danta/schemas', replacement: path.resolve(__dirname, '../../packages/schemas/src') },
    ],
  },
});
