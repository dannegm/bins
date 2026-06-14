import path from 'path';
import { execSync } from 'child_process';
import { defineConfig } from 'vite';
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

export default defineConfig({
    define: {
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
