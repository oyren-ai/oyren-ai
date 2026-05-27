/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(process.cwd(), './src'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        css: true,
        exclude: [
            'node_modules/**',
            'dist/**',
            'tests/e2e-web/**',
            '**/*.e2e.{test,spec}.{js,ts,jsx,tsx}',
            'sidecars/**',
            '**/node_modules/**',
            '**/.deno/**',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'text-summary'],
            exclude: [
                'node_modules/',
                'src/test/',
                'tests/e2e-web/**',
                '**/*.d.ts',
                '**/*.test.{ts,tsx}',
                '**/*.spec.{ts,tsx}',
                'src-tauri/',
                'sidecars/**',
                'dist/',
                'coverage/',
                'src/main.tsx',
                'src/vite-env.d.ts',
                'src/components/common/icons/**',
                'src/config/constants/**',
                'scripts/**',
                'src/types/**',
                '**/__mocks__/**',
                'vite.config.ts',
                'vitest.config.ts',
                'vitest.config.*.ts',
                'tailwind.config.js',
                'postcss.config.js',
                '*.config.{js,ts}',
                'public/**',
                '**/*.min.js',
                '**/*.worker.js',
                'debug-*.js',
                '*.js'
            ],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80
                }
            }
        },
    },
})
