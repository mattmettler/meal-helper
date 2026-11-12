// Checks that dist/ is an installable, offline-capable PWA build.
//
// Usage: node scripts/verify-build.mjs [--help]
//        npm run verify:build   (builds first, then runs this)
//
// Run after `vite build`. Exits 0 when every check passes. Otherwise prints one
// line per failed check and exits 1. Checks:
//   - dist/sw.js and dist/manifest.webmanifest exist
//   - manifest: display standalone, start_url and scope under /meal-helper/,
//     192x192 icon, 512x512 icon, a maskable icon, and every icon file exists
//   - dist/index.html links an existing Apple touch icon and has theme-color
//   - dist/index.html and dist/**/*.css reference no http(s) hosts in
//     src, href, or url(...)
//   - the service worker precache lists every dist/assets JS and CSS file
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(
    'Usage: node scripts/verify-build.mjs\n' +
      'Verifies dist/ (run `npm run build` first, or use `npm run verify:build`).\n' +
      'Exits non-zero and names each failed check.',
  )
  process.exit(0)
}

const root = resolve(fileURLToPath(import.meta.url), '..', '..')
const dist = join(root, 'dist')
const base = '/meal-helper/'
const failures = []
const fail = (message) => failures.push(message)

const read = (path) => readFileSync(path, 'utf8')

const listFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)],
  )

const distPathFor = (url) => join(dist, url.startsWith(base) ? url.slice(base.length) : url.replace(/^\//, ''))

function checkManifest() {
  const manifestPath = join(dist, 'manifest.webmanifest')
  if (!existsSync(manifestPath)) return fail('dist/manifest.webmanifest is missing')
  const manifest = JSON.parse(read(manifestPath))
  if (manifest.display !== 'standalone') fail(`manifest display is "${manifest.display}", expected "standalone"`)
  for (const key of ['start_url', 'scope']) {
    if (!String(manifest[key] ?? '').startsWith(base)) fail(`manifest ${key} is "${manifest[key]}", expected it to start with ${base}`)
  }
  const icons = manifest.icons ?? []
  for (const size of ['192x192', '512x512']) {
    if (!icons.some((icon) => icon.sizes === size)) fail(`manifest has no ${size} icon`)
  }
  if (!icons.some((icon) => String(icon.purpose ?? '').split(' ').includes('maskable'))) fail('manifest has no maskable icon')
  for (const icon of icons) {
    if (!existsSync(distPathFor(icon.src))) fail(`manifest icon ${icon.src} does not exist in dist`)
  }
}

function checkIndexHtml(html) {
  const touchIcon = html.match(/<link[^>]*rel="apple-touch-icon"[^>]*>/)?.[0]
  const touchHref = touchIcon?.match(/href="([^"]+)"/)?.[1]
  if (!touchHref) fail('dist/index.html has no apple-touch-icon link')
  else if (!existsSync(distPathFor(touchHref))) fail(`apple-touch-icon ${touchHref} does not exist in dist`)
  if (!/<meta[^>]*name="theme-color"/.test(html)) fail('dist/index.html has no theme-color meta')
}

function checkNoRemoteReferences(path, text) {
  const name = relative(root, path).replaceAll('\\', '/')
  const remote = [
    ...text.matchAll(/\b(?:src|href)\s*=\s*["']?(https?:\/\/[^"'\s>]+)/g),
    ...text.matchAll(/url\(\s*["']?(https?:\/\/[^"')\s]+)/g),
  ]
  for (const [, url] of remote) fail(`${name} references remote URL ${url}`)
}

function checkServiceWorker() {
  const swPath = join(dist, 'sw.js')
  if (!existsSync(swPath)) return fail('dist/sw.js is missing (no service worker was built)')
  let precacheSource = read(swPath)
  for (const [, imported] of precacheSource.matchAll(/importScripts\(\s*["']([^"']+)["']/g)) {
    const importedPath = distPathFor(imported.replace(/^\.\//, ''))
    if (existsSync(importedPath)) precacheSource += read(importedPath)
  }
  const assetsDir = join(dist, 'assets')
  const assets = existsSync(assetsDir) ? readdirSync(assetsDir).filter((file) => /\.(js|css)$/.test(file)) : []
  if (assets.length === 0) fail('dist/assets has no JS or CSS files')
  for (const file of assets) {
    if (!precacheSource.includes(file)) fail(`service worker precache does not list assets/${file}`)
  }
}

if (!existsSync(dist)) {
  console.error('FAIL: dist/ does not exist. Run `npm run build` first.')
  process.exit(1)
}

checkManifest()
checkServiceWorker()
const indexPath = join(dist, 'index.html')
if (!existsSync(indexPath)) fail('dist/index.html is missing')
else {
  const html = read(indexPath)
  checkIndexHtml(html)
  checkNoRemoteReferences(indexPath, html)
}
for (const css of listFiles(dist).filter((file) => file.endsWith('.css'))) {
  checkNoRemoteReferences(css, read(css))
}

if (failures.length > 0) {
  console.error(`verify-build FAILED (${failures.length}):`)
  for (const message of failures) console.error(`  - ${message}`)
  process.exit(1)
}
console.log('verify-build OK')
