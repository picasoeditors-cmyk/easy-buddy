// ─────────────────────────────────────────────────────────────────────────────
// Easy Buddy · Local Claude Bridge
//
// Lets the Easy Buddy chatbot (running in your browser) talk to YOUR Claude,
// through the Claude Code program installed on this laptop and your own Claude login.
// No API key is needed. Meant for private demos on your own machine.
//
// Start:  npm run bridge        (or double-click Start-Claude-Bridge.cmd)
// Stop:   Ctrl+C
//
// Only listens on 127.0.0.1 (this computer). Uses only Node's built-in modules.
// ─────────────────────────────────────────────────────────────────────────────
import http from 'node:http'
import { spawn, execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.env.BRIDGE_PORT || 8787)
const ALLOWED_ORIGINS = new Set([
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
  'https://picasoeditors-cmyk.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
])
const MAX_BODY_BYTES = 300_000
const REPLY_TIMEOUT_MS = 120_000

// ── Find the Claude Code program ────────────────────────────────────────────
const newestFile = (dir, name, depth = 7) => {
  const found = []
  const walk = (d, level) => {
    if (level > depth) return
    let entries = []
    try {
      entries = fs.readdirSync(d, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p, level + 1)
      else if (e.name.toLowerCase() === name) found.push(p)
    }
  }
  walk(dir, 0)
  return found.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0]
}

const findClaude = () => {
  if (process.env.CLAUDE_PATH && fs.existsSync(process.env.CLAUDE_PATH)) return process.env.CLAUDE_PATH
  const isWin = process.platform === 'win32'
  try {
    const cmd = isWin ? 'where' : 'which'
    const hit = execFileSync(cmd, ['claude'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split(/\r?\n/)[0].trim()
    if (hit && !hit.toLowerCase().endsWith('.ps1')) return hit
  } catch {}
  if (isWin && process.env.LOCALAPPDATA) {
    const bundled = newestFile(path.join(process.env.LOCALAPPDATA, 'Claude-Data'), 'claude.exe')
    if (bundled) return bundled
  }
  const local = path.join(os.homedir(), '.local', 'bin', isWin ? 'claude.exe' : 'claude')
  if (fs.existsSync(local)) return local
  return null
}

const CLAUDE = findClaude()

// Empty working folder so Claude Code doesn't pick up any project files or settings
const WORKDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'easybuddy-bridge-'))

const claudeStatus = () => {
  if (!CLAUDE) return { found: false, loggedIn: false }
  try {
    const version = execFileSync(CLAUDE, ['--version'], { encoding: 'utf8', cwd: WORKDIR, timeout: 20_000 }).trim()
    let loggedIn = false
    try {
      const status = JSON.parse(execFileSync(CLAUDE, ['auth', 'status'], { encoding: 'utf8', cwd: WORKDIR, timeout: 20_000 }))
      loggedIn = !!status.loggedIn
    } catch (error) {
      try {
        loggedIn = !!JSON.parse(error.stdout || '{}').loggedIn
      } catch {}
    }
    return { found: true, version, loggedIn }
  } catch (error) {
    return { found: true, loggedIn: false, error: error.message }
  }
}

// ── Ask Claude (one request at a time) ──────────────────────────────────────
const MODEL_RE = /^(opus|sonnet|haiku|claude-[a-z0-9-]{3,40})$/

const toTranscript = (messages) => {
  const lines = messages.map((m) => `${m.role === 'user' ? 'CUSTOMER' : 'YOU'}: ${String(m.content).trim()}`)
  return `Here is the chat so far:\n\n${lines.join('\n\n')}\n\nWrite your next reply to the CUSTOMER's latest message. Output only the reply text itself.`
}

const askClaude = ({ system, messages, model }) =>
  new Promise((resolve, reject) => {
    const args = ['-p', '--output-format', 'json', '--max-turns', '1', '--tools', '', '--system-prompt', system]
    if (model && MODEL_RE.test(model)) args.push('--model', model)
    const child = spawn(CLAUDE, args, { cwd: WORKDIR, windowsHide: true })
    let out = ''
    let err = ''
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error('Claude took too long to reply'))
    }, REPLY_TIMEOUT_MS)
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (err += d))
    child.on('error', (e) => {
      clearTimeout(timer)
      reject(e)
    })
    child.on('close', () => {
      clearTimeout(timer)
      try {
        const data = JSON.parse(out)
        if (data.is_error) return reject(new Error(data.result || 'Claude returned an error'))
        resolve(String(data.result || '').trim())
      } catch {
        reject(new Error((err || out || 'No reply from Claude').trim().slice(0, 300)))
      }
    })
    child.stdin.end(toTranscript(messages))
  })

let queue = Promise.resolve()
const enqueue = (job) => {
  const run = queue.then(job, job)
  queue = run.catch(() => {})
  return run
}

// ── HTTP server ─────────────────────────────────────────────────────────────
const send = (res, status, body, origin) => {
  const headers = { 'content-type': 'application/json; charset=utf-8' }
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['access-control-allow-origin'] = origin
    headers.vary = 'Origin'
  }
  res.writeHead(status, headers)
  res.end(JSON.stringify(body))
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin
  if (origin && !ALLOWED_ORIGINS.has(origin)) return send(res, 403, { error: 'Origin not allowed' })

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': origin || '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-private-network': 'true',
      'access-control-max-age': '600',
      vary: 'Origin',
    })
    return res.end()
  }

  if (req.method === 'GET' && req.url === '/health') {
    const s = claudeStatus()
    return send(res, 200, { ok: s.found && s.loggedIn, ...s }, origin)
  }

  if (req.method === 'POST' && req.url === '/chat') {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY_BYTES) req.destroy()
      else chunks.push(c)
    })
    req.on('end', async () => {
      let body
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      } catch {
        return send(res, 400, { error: 'Invalid JSON' }, origin)
      }
      const { system, messages, model } = body || {}
      if (typeof system !== 'string' || !Array.isArray(messages) || !messages.length) return send(res, 400, { error: 'Expected { system, messages }' }, origin)
      if (!CLAUDE) return send(res, 503, { error: 'Claude Code was not found on this computer' }, origin)
      const started = Date.now()
      try {
        const text = await enqueue(() => askClaude({ system, messages, model }))
        console.log(`  ✓ replied in ${((Date.now() - started) / 1000).toFixed(1)}s`)
        send(res, 200, { text }, origin)
      } catch (error) {
        console.log(`  ✗ ${error.message}`)
        send(res, 502, { error: error.message }, origin)
      }
    })
    return
  }

  if (req.method === 'GET') return serveSite(req, res)

  send(res, 404, { error: 'Not found' }, origin)
})

// ── Serve the built Easy Buddy site (dist/) so site + Claude share one address ──
const SITE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.csv': 'text/csv; charset=utf-8',
  '.woff2': 'font/woff2',
}

const serveSite = (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  let file = path.resolve(SITE_DIR, '.' + (urlPath === '/' ? '/index.html' : urlPath))
  if (!file.startsWith(SITE_DIR)) {
    res.writeHead(403)
    return res.end('Forbidden')
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(SITE_DIR, 'index.html')
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    return res.end('Site not built yet. Run: npm run build')
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' })
  fs.createReadStream(file).pipe(res)
}

server.listen(PORT, '127.0.0.1', () => {
  const s = claudeStatus()
  console.log('')
  console.log('  Easy Buddy · Local Claude Bridge')
  console.log(`  Listening on http://localhost:${PORT}`)
  console.log(`  Claude Code: ${s.found ? `${s.version || 'found'} (${CLAUDE})` : 'NOT FOUND — install Claude Code or set CLAUDE_PATH'}`)
  console.log(`  Signed in:   ${s.loggedIn ? 'yes' : 'NO — run the sign-in step in the README'}`)
  console.log(`  Open Easy Buddy: http://localhost:${PORT}`)
  console.log('  Keep this window open while you demo. Press Ctrl+C to stop.')
  console.log('')
  if (process.env.OPEN_BROWSER === '1' && process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', `http://localhost:${PORT}/#launchpad`], { detached: true, stdio: 'ignore', windowsHide: true }).unref()
  }
})
