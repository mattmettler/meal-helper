// Regenerates the PWA icons in public/ from assets/icon/icon-1024.png.
//
// Usage: node scripts/generate-icons.mjs   (or npm run generate:icons)
//
// @vite-pwa/assets-generator writes its output next to the source image, so
// this runs it (config: pwa-assets.config.ts) and moves the results into
// public/. Prints the generator's own output; exits non-zero if it fails.
import { execFileSync } from 'node:child_process'
import { mkdirSync, renameSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node scripts/generate-icons.mjs\nRegenerates public/ icons from assets/icon/icon-1024.png.')
  process.exit(0)
}

const root = resolve(fileURLToPath(import.meta.url), '..', '..')
const sourceDir = join(root, 'assets', 'icon')
const outputs = [
  'pwa-64x64.png',
  'pwa-192x192.png',
  'pwa-512x512.png',
  'maskable-icon-512x512.png',
  'apple-touch-icon-180x180.png',
  'favicon.ico',
]

const generator = join(root, 'node_modules', '@vite-pwa', 'assets-generator', 'bin', 'pwa-assets-generator.mjs')
execFileSync(process.execPath, [generator], { cwd: root, stdio: 'inherit' })
mkdirSync(join(root, 'public'), { recursive: true })
for (const file of outputs) renameSync(join(sourceDir, file), join(root, 'public', file))
console.log(`Moved ${outputs.length} icons to public/`)
