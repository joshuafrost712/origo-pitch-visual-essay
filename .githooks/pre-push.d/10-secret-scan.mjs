#!/usr/bin/env node
// W-00 D1: scans the ADDED lines of every pushed commit for secret shapes before they leave the
// machine. Population: the commits past the remote sha, or, for a new branch, past every ref of
// the remote being pushed to. Client-side: --no-verify skips it.
//
// The patterns are assembled from pieces so this file never matches its own scan, nor the
// repo-wide history grep in W-00 criterion 9.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const remote = process.argv[2] || 'origin'
const ZERO = '0'.repeat(40)
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })

const PK = 'PRIVATE' + ' KEY'
const patterns = [
  { name: 'private key header', re: new RegExp('-----BEGIN [A-Z ]*' + PK + '-----') },
  { name: 'htpasswd apr1 line', re: new RegExp('^[^:\\s]+:\\$' + 'apr1\\$') },
  { name: 'htpasswd bcrypt line', re: new RegExp('^[^:\\s]+:\\$' + '2[aby]\\$\\d\\d\\$') },
  { name: 'AuthUserFile with an absolute path', re: new RegExp('Auth' + 'UserFile\\s+/') },
]
const badName = [
  { name: '.htpasswd file', re: /(^|\/)\.htpasswd$/ },
  { name: '.pem file', re: /\.pem$/ },
]

const hits = []
const input = readFileSync(0, 'utf8')
for (const line of input.split('\n')) {
  const [localRef, localSha, , remoteSha] = line.trim().split(/\s+/)
  if (!localRef || !localSha || localSha === ZERO) continue
  let range
  if (remoteSha && remoteSha !== ZERO && git('cat-file', '-t', remoteSha).trim() === 'commit') range = [localSha, `^${remoteSha}`]
  else range = [localSha, '--not', `--remotes=${remote}`]
  let commits = []
  try { commits = git('rev-list', ...range).split('\n').filter(Boolean) } catch { commits = git('rev-list', localSha).split('\n').filter(Boolean) }
  for (const c of commits) {
    const diff = git('show', '--format=', '--unified=0', '--no-color', '--no-renames', c)
    let path = '?'
    for (const d of diff.split('\n')) {
      if (d.startsWith('+++ ')) {
        path = d.slice(4).replace(/^b\//, '')
        for (const b of badName) if (b.re.test(path)) hits.push(`secret pattern: ${b.name} in ${path}`)
        continue
      }
      if (!d.startsWith('+') || d.startsWith('+++')) continue
      const text = d.slice(1)
      for (const p of patterns) if (p.re.test(text)) hits.push(`secret pattern: ${p.name} in ${path}`)
    }
  }
}
if (hits.length) {
  for (const h of [...new Set(hits)]) console.log(h)
  process.exit(1)
}
