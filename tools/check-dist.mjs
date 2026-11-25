#!/usr/bin/env node
// W-00 D3: asserts a built dist/ is fit for its target before anything is uploaded.
//   node tools/check-dist.mjs <dir> --target preview|live [--local]
// Runs after deploy/prepare.sh has written <dir>/.htaccess. Exit 1 names every failure.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const dir = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--target')
const ti = args.indexOf('--target')
const target = ti === -1 ? undefined : args[ti + 1]
const local = args.includes('--local')

if (target !== 'preview' && target !== 'live') {
  console.log('unknown target')
  process.exit(1)
}
if (!dir || !existsSync(join(dir, 'index.html'))) {
  console.log(`no index.html in ${dir ?? '(no dir given)'}`)
  process.exit(1)
}

const html = readFileSync(join(dir, 'index.html'), 'utf8')
const htPath = join(dir, '.htaccess')
const ht = existsSync(htPath) ? readFileSync(htPath, 'utf8') : null
// Comment lines in .htaccess do not count, so a commented-out directive cannot satisfy a check.
const htLines = (ht ?? '').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
const htHas = (re) => htLines.some((l) => re.test(l))
const failures = []

const meta = (name) => {
  const m = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*>`, 'i'))
  return m ? (m[0].match(/content=["']([^"']*)["']/i)?.[1] ?? '') : null
}

const commit = meta('origo-commit')
if (!(commit && (/^[0-9a-f]{40}$/.test(commit) || (local && commit === 'local')))) failures.push('commit marker missing')
if (meta('app') !== 'origo-site') failures.push('app meta missing')
if (html.includes('/origo-pitch-visual-essay/')) failures.push('old base path')

const base = target === 'preview' ? '/preview/' : '/'
const assetRefs = [...html.matchAll(/(?:src|href)=["']([^"']*assets\/[^"']*)["']/g)].map((m) => m[1])
if (assetRefs.length === 0 || assetRefs.some((u) => !u.startsWith(`${base}assets/`))) failures.push('wrong base path')

if (ht === null) failures.push('htaccess missing')

const robots = meta('robots')
const robotsNoindex = robots !== null && /noindex/i.test(robots)
const headerNoindex = htHas(/^Header\s+(always\s+)?set\s+X-Robots-Tag\s+.*noindex/i)
const authType = htHas(/^AuthType\s+Basic\b/i)
const requireUser = htHas(/^Require\s+valid-user\b/i)
const authFile = htHas(/^AuthUserFile\s+\S+/i)

// SEC-01: both targets send the security headers, and the preview never asks for its password over
// plain HTTP. Checked here so a later edit to a template cannot drop them without failing the deploy.
const securityHeaders = [
  /^Header\s+always\s+set\s+Content-Security-Policy\s+".*default-src 'none'.*frame-ancestors 'none'/i,
  /^Header\s+always\s+set\s+X-Content-Type-Options\s+"nosniff"/i,
  /^Header\s+always\s+set\s+Referrer-Policy\s+/i,
  /^Header\s+always\s+set\s+X-Frame-Options\s+"DENY"/i,
  /^Header\s+always\s+set\s+Permissions-Policy\s+/i,
]
if (!securityHeaders.every((re) => htHas(re))) failures.push('security headers missing')
if (target === 'preview' && !(htHas(/^<If\s+"%\{HTTPS\} != 'on'/i) && htHas(/^Require\s+all\s+denied\b/i))) {
  failures.push('preview password allowed over http')
}
if (target === 'live' && !(htHas(/^RewriteCond\s+%\{HTTPS\}\s+!=on/i) && htHas(/^RewriteRule\s+\^\s+https:\/\//i))) {
  failures.push('live https redirect missing')
}

if (target === 'preview') {
  if (!robotsNoindex || !headerNoindex) failures.push('noindex missing')
  if (!(authType && requireUser && authFile)) failures.push('password block missing')
} else {
  if (robotsNoindex || headerNoindex) failures.push('noindex on live')
  if (htHas(/^AuthType\b/i) || requireUser) failures.push('password on live')
}

if (failures.length) {
  for (const f of failures) console.log(f)
  process.exit(1)
}
console.log(`dist check: ok (target=${target}, commit=${commit})`)
