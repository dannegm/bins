import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const getCommitHash = () => {
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
        return process.env.VERCEL_GIT_COMMIT_SHA;
    }
    try {
        return execSync('git rev-parse HEAD').toString().trim();
    } catch {
        return 'unknown';
    }
};

const { version } = require('./package.json');

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(version),
        __COMMIT_HASH__: JSON.stringify(getCommitHash()),
        __COMMIT_HASH_SHORT__: JSON.stringify(getCommitHash().slice(0, 7)),
    },
    plugins: [
        TanStackRouterVite({
            routesDirectory: './src/routes',
            generatedRouteTree: './src/routeTree.gen.js',
            disableTypes: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
