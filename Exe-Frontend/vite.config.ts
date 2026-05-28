import { defineConfig, type Plugin } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Stub Figma Make virtual modules so the app can run outside Figma.
// - `figma:asset/<file>`: resolve to a transparent 1x1 PNG data URL
// - `figma:foundry-client-api`: resolve to an empty module
function figmaStubs(): Plugin {
  const TRANSPARENT_PNG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  return {
    name: 'figma-make-stubs',
    enforce: 'pre',
    resolveId(id) {
      if (id.startsWith('figma:asset/') || id === 'figma:foundry-client-api') {
        return '\0' + id
      }
      return null
    },
    load(id) {
      if (id.startsWith('\0figma:asset/')) {
        return `export default ${JSON.stringify(TRANSPARENT_PNG)};`
      }
      if (id === '\0figma:foundry-client-api') {
        return 'export {};'
      }
      return null
    },
  }
}

export default defineConfig({
  plugins: [
    figmaStubs(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    host: true,
    port: 5173,
  },
})
