#!/usr/bin/env node
// W-00: the one live reader for origohub.org (tools/verify-live.mjs reads the old Pages site).
//   node tools/check-live.mjs --target preview|live [--no-js] [--no-auth] [--count <string>] [--resolve <ip>]
// preview reads https://origohub.org/preview/ with basic-auth credentials from the file
// ORIGO_SITE_AUTH names (user:password); live reads https://origohub.org/ with none.
// Prints status, the commit marker, the robots meta, the X-Robots-Tag header and every cookie name.
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const opt = (n) => { const i = args.indexOf(n); return i === -1 ? undefined : args[i + 1] }
const target = opt('--target')
if (target !== 'preview' && target !== 'live') { console.log('unknown target'); process.exit(2) }
const noJs = args.includes('--no-js')
const noAuth = args.includes('--no-auth')
const count = opt('--count')
const resolve = opt('--resolve')
const url = target === 'preview' ? 'https://origohub.org/preview/' : 'https://origohub.org/'

let httpCredentials
if (target === 'preview' && !noAuth) {
  const f = process.env.ORIGO_SITE_AUTH
  if (!f) { console.log('ORIGO_SITE_AUTH is not set; refusing (it names the credentials file)'); process.exit(2) }
  const raw = readFileSync(f, 'utf8').trim()
  const i = raw.indexOf(':')
  httpCredentials = { username: raw.slice(0, i), password: raw.slice(i + 1) }
}

const browser = await chromium.launch({ args: resolve ? [`--host-resolver-rules=MAP origohub.org ${resolve}`] : [] })
try {
  const ctx = await browser.newContext({ javaScriptEnabled: !noJs, httpCredentials })
  const page = await ctx.newPage()
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  const status = res ? res.status() : 0
  const headers = res ? await res.allHeaders() : {}
  const html = res ? await res.text() : ''
  const meta = (name) => {
    const m = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*>`, 'i'))
    return m ? (m[0].match(/content=["']([^"']*)["']/i)?.[1] ?? '') : 'none'
  }
  const cookies = (await ctx.cookies()).map((c) => c.name)
  console.log(`url=${url} target=${target} js=${noJs ? 'off' : 'on'} auth=${httpCredentials ? 'yes' : 'no'}${resolve ? ` resolve=${resolve}` : ''}`)
  console.log(`status=${status}`)
  console.log(`origo-commit=${meta('origo-commit')}`)
  console.log(`robots=${meta('robots')}`)
  console.log(`x-robots-tag=${headers['x-robots-tag'] ?? 'none'}`)
  console.log(`challenge=${/cf-mitigated/i.test(Object.keys(headers).join(' ')) || /Just a moment/i.test(html) ? 'yes' : 'no'}`)
  console.log(`cookies=${cookies.length ? cookies.join(',') : 'none'}`)
  if (count !== undefined) console.log(`count(${count})=${html.split(count).length - 1}`)
} finally {
  await browser.close()
}
