#!/usr/bin/env node
// W-00 delete guard. Two modes.
//
//   check:    node tools/check-delete-plan.mjs check --plan <rsync dry-run itemize output>
//               --manifest <manifest file> --protected <protected list> [--htaccess <live .htaccess copy>]
//   manifest: node tools/check-delete-plan.mjs manifest <dist dir> --protected <protected list>
//               prints the manifest for what the deploy is about to write.
//
// The manifest lists every path the last deploy of this target wrote (directories end in "/"),
// plus one line "htaccess-sha256 <hex>" for the .htaccess it wrote. Protected prefixes are
// anchored to the target folder ("/preview/" means "<target>/preview/") and are never listed.
// A missing --htaccess file means the target has no live .htaccess.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const args = process.argv.slice(2)
const mode = args.shift()
const opt = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}

function readProtected(path) {
  if (!path || !existsSync(path)) {
    console.error(`protected list missing: ${path ?? '(none given)'}`)
    process.exit(2)
  }
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.replace(/^\/+/, '')) // rsync itemizes paths relative to the transfer root
}

const underAny = (path, prefixes) =>
  prefixes.some((p) => {
    const bare = p.replace(/\/+$/, '')
    return path === p || path === bare || path.startsWith(bare + '/')
  })

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

if (mode === 'manifest') {
  const dist = args.shift()
  const prot = readProtected(opt('--protected'))
  const out = []
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name)
      const rel = relative(dist, full).split('\\').join('/')
      const isDir = statSync(full).isDirectory()
      const entry = isDir ? rel + '/' : rel
      if (underAny(entry, prot)) continue
      out.push(entry)
      if (isDir) walk(full)
    }
  }
  walk(dist)
  const ht = join(dist, '.htaccess')
  if (existsSync(ht)) out.push(`htaccess-sha256 ${sha256(readFileSync(ht))}`)
  process.stdout.write(out.join('\n') + '\n')
  process.exit(0)
}

if (mode !== 'check') {
  console.error('usage: check-delete-plan.mjs check|manifest ...')
  process.exit(2)
}

const failures = []
const prot = readProtected(opt('--protected'))
const manifestPath = opt('--manifest')
if (!manifestPath || !existsSync(manifestPath)) {
  console.log('manifest missing')
  process.exit(1)
}
const manifestLines = readFileSync(manifestPath, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean)
const recordedHash = manifestLines.find((l) => l.startsWith('htaccess-sha256 '))?.split(' ')[1]
const managed = new Set(manifestLines.filter((l) => !l.startsWith('htaccess-sha256 ')))
const isManaged = (p) => managed.has(p) || managed.has(p.replace(/\/+$/, '')) || managed.has(p.replace(/\/*$/, '/'))

const planPath = opt('--plan')
if (!planPath || !existsSync(planPath)) {
  console.log('dry-run plan missing')
  process.exit(1)
}
for (const raw of readFileSync(planPath, 'utf8').split('\n')) {
  const line = raw.replace(/\r$/, '')
  if (!line.trim()) continue
  const del = line.match(/^\*deleting\s+(.+)$/)
  if (del) {
    const p = del[1]
    if (underAny(p, prot)) failures.push(`protected path in delete plan: ${p}`)
    else if (!isManaged(p)) failures.push(`would delete unmanaged: ${p}`)
    continue
  }
  // Itemized transfer lines: 11 flag characters, a space, the path. On a push to a remote,
  // rsync itemizes a sent file as "<f" (">f" is a local receive; both are accepted), "cd"
  // creates a directory and "hf" a hard link; each would write into a protected prefix.
  const xfer = line.match(/^([<>ch][fdLDS][^ ]{9}) (.+)$/)
  if (xfer && underAny(xfer[2], prot)) failures.push(`protected path in upload plan: ${xfer[2]}`)
}

const liveHt = opt('--htaccess')
const liveExists = Boolean(liveHt && existsSync(liveHt))
if (recordedHash === undefined) {
  if (liveExists) failures.push('server .htaccess changed outside deploy')
} else if (!liveExists || sha256(readFileSync(liveHt)) !== recordedHash) {
  failures.push('server .htaccess changed outside deploy')
}

if (failures.length) {
  for (const f of failures) console.log(f)
  process.exit(1)
}
console.log('delete plan: ok')
