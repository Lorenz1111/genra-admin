import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isGithubPages = process.env.GITHUB_ACTIONS || process.env.NODE_ENV === 'production' && process.env.VITE_DEPLOY_TARGET === 'gh-pages'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()], 
  base: isGithubPages ? '/genra/' : '/',
})
