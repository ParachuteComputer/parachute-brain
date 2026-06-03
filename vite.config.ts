import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project-page deploy: built assets live under /parachute-brain/ on GitHub Pages,
// but dev stays at root. Base-aware code downstream reads import.meta.env.BASE_URL.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/parachute-brain/' : '/',
  plugins: [react()],
}))
