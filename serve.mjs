import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'

const PORT = 8099
const DIST = join(import.meta.dirname, '.vitepress', 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

async function tryPath(filePath) {
  try {
    const s = await stat(filePath)
    if (s.isFile()) return filePath
    if (s.isDirectory()) {
      const idx = join(filePath, 'index.html')
      try { await stat(idx); return idx } catch {}
    }
  } catch {}
  return null
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  let pathname = decodeURIComponent(url.pathname)

  // Try exact path, then with .html, then as directory/index.html
  const base = join(DIST, pathname)
  let filePath = await tryPath(base)
    ?? await tryPath(base + '.html')

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h1>404 Not Found</h1>')
    return
  }

  const ext = extname(filePath)
  const mime = MIME[ext] || 'application/octet-stream'
  const content = await readFile(filePath)
  res.writeHead(200, { 'Content-Type': mime })
  res.end(content)
})

server.listen(PORT, () => {
  console.log(`\n  ✓ Serving docs at http://localhost:${PORT}`)
  console.log(`    ├── 13.x → http://localhost:${PORT}/docs/13.x/`)
  console.log(`    └── 12.x → http://localhost:${PORT}/docs/12.x/`)
  console.log(`\n  Press Ctrl+C to stop.\n`)
})
