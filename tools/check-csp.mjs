#!/usr/bin/env node
// SEC-01: load a served build in headless Chromium under the headers the server really sends, visit
// every tab, run the sign-up form down both of its paths, and fail on any CSP violation.
//   node tools/check-csp.mjs <url> [--auth user:pass]
// Pair it with tests/apache-local.sh, which serves the build through the real .htaccess:
//   node tools/check-csp.mjs https://127.0.0.1:18443/
//   node tools/check-csp.mjs https://127.0.0.1:18443/preview/ --auth test:test
// The sign-up endpoint is never contacted: Chromium resolves script.google.com and
// script.googleusercontent.com to a stub HTTPS server run here, so no row is written to the live
// Sheet. The stub answers as Apps Script does (a 302 from /exec to script.googleusercontent.com,
// with CORS on both hops), so the real redirect runs under the real policy.
// Exit 1 names every violation; prints "csp check: ok" otherwise.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:https'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const url = args.find((a) => /^https?:\/\//.test(a))
const ai = args.indexOf('--auth')
const auth = ai === -1 ? null : args[ai + 1]
if (!url) {
  console.log('usage: node tools/check-csp.mjs <url> [--auth user:pass]')
  process.exit(2)
}

const TABS = ['story', 'work', 'engine', 'quality', 'road', 'recommendations', 'together']
const failures = []
const note = (m) => failures.push(m)

// The stub endpoint. mode decides how the POST is answered.
let mode = 'post-ok'
const seen = []
const tmp = mkdtempSync(join(tmpdir(), 'check-csp-'))
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=stub',
  '-keyout', join(tmp, 'k.pem'), '-out', join(tmp, 'c.pem')], { stdio: 'ignore' })
const stub = createServer({ key: readFileSync(join(tmp, 'k.pem')), cert: readFileSync(join(tmp, 'c.pem')) }, (req, res) => {
  const host = (req.headers.host || '').split(':')[0]
  const u = new URL(req.url, `https://${host}`)
  seen.push(`${req.method} ${host}`)
  res.setHeader('access-control-allow-origin', '*')
  if (host === 'script.google.com') {
    if (req.method === 'POST' && mode === 'post-fail') return req.socket.destroy()
    res.writeHead(302, { location: `https://script.googleusercontent.com/macros/echo?cb=${u.searchParams.get('callback') ?? ''}` })
    return res.end()
  }
  const cb = u.searchParams.get('cb')
  const body = JSON.stringify({ ok: true, status: 'added' })
  if (cb) {
    res.writeHead(200, { 'content-type': 'text/javascript' })
    return res.end(`${cb}(${body});`)
  }
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end(body)
})
await new Promise((r) => stub.listen(0, '127.0.0.1', r))
const port = stub.address().port

const browser = await chromium.launch({
  args: [`--host-resolver-rules=MAP script.google.com 127.0.0.1:${port}, MAP script.googleusercontent.com 127.0.0.1:${port}`],
})
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  httpCredentials: auth ? { username: auth.split(':')[0], password: auth.split(':').slice(1).join(':') } : undefined,
})
// Report violations from inside the page straight to this process, so a reload loses none.
const violations = []
await context.exposeBinding('__cspReport', (_src, v) => violations.push(v))
await context.addInitScript(() => {
  document.addEventListener('securitypolicyviolation', (e) => {
    window.__cspReport(`${e.effectiveDirective} blocked ${e.blockedURI || '(inline)'} at ${e.sourceFile || ''}:${e.lineNumber || ''}`)
  })
})
const page = await context.newPage()
page.on('pageerror', (e) => note(`page error: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error' && /Content Security Policy|Refused to/i.test(m.text())) note(`console: ${m.text().slice(0, 200)}`)
})

const first = await page.goto(url, { waitUntil: 'networkidle' })
const csp = first?.headers()['content-security-policy']
if (!csp) note('no Content-Security-Policy header on the page')

for (const tab of TABS) {
  await page.goto(`${url}#/${tab}`, { waitUntil: 'networkidle' })
  // Scroll the whole tab so lazy images and below-the-fold demos load and run.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
  })
  await page.waitForLoadState('networkidle')
}

async function signup(m) {
  mode = m
  await page.goto(`${url}#/together`, { waitUntil: 'networkidle' })
  await page.reload({ waitUntil: 'networkidle' })
  const form = page.locator('form.su-form')
  if ((await form.count()) === 0) return note(`${m}: no sign-up form rendered (is VITE_SIGNUP_URL set for the build?)`)
  await form.locator('input[name=email]').fill('csp-check@example.invalid')
  await form.locator('input[name=updates]').check()
  await form.locator('button[type=submit]').click()
  const ok = await page.locator('.su-status--ok').waitFor({ timeout: 8000 }).then(() => true, () => false)
  if (!ok) note(`${m}: the form did not report success`)
}
await signup('post-ok')
await signup('post-fail')

for (const v of new Set(violations)) note(`csp: ${v}`)
await browser.close()
stub.close()
rmSync(tmp, { recursive: true, force: true })

console.log(`url=${url}`)
console.log(`csp=${csp ?? '(none)'}`)
console.log(`endpoint requests stubbed: ${[...new Set(seen)].join(', ') || 'none'}`)
if (failures.length) {
  for (const f of [...new Set(failures)]) console.log(f)
  process.exit(1)
}
console.log('csp check: ok')
