import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project-page deploy: built assets live under /parachute-brain/ on GitHub Pages,
// but dev stays at root. Base-aware code downstream reads import.meta.env.BASE_URL.
//
// Heads-up: `vite preview` renders a BLANK page for this app — public/404.html
// (the SPA fallback for GitHub Pages) and preview's base routing form a redirect
// loop. To check a production build locally, either `bun run dev`, or static-serve
// `dist/` (e.g. python3 -m http.server from a dir where /parachute-brain/ → dist/).
// GitHub Pages itself serves index.html correctly, so this is preview-only.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/parachute-brain/' : '/',
  plugins: [react()],
}))
