/// <reference types="vitest/config" />
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    feedApiDevServer(mode),
  ],
  test: {
    environment: 'jsdom',
  },
}))

/**
 * Dev only: serve /api/feed with the same handler Vercel deploys, so
 * `npm run dev` works without the Vercel CLI. Private feed URLs come from .env.local.
 */
function feedApiDevServer(mode: string): Plugin {
  return {
    name: 'feed-api-dev-server',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
      server.middlewares.use('/api/feed', async (req, res) => {
        const { default: handler } = await server.ssrLoadModule('/api/feed.ts')
        const url = new URL((req as { originalUrl?: string }).originalUrl ?? req.url ?? '/', 'http://localhost')
        const response: Response = await handler.fetch(new Request(url, { method: req.method }))
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
    },
  }
}
