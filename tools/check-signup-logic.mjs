/**
 * Local logic check for signup/server/Code.gs.
 *
 * NOT a substitute for `tools/verify-signup.mjs`, which talks to the deployed
 * endpoint and is the check that actually matters. This runs Code.gs inside a
 * vm against stubbed Apps Script services, so a logic bug shows up here instead
 * of costing a paste-save-redeploy cycle in the browser. Run it after any edit
 * to Code.gs, before deploying.
 *
 * Run: node tools/check-signup-logic.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const REPO = dirname(dirname(fileURLToPath(import.meta.url)))
const src = readFileSync(join(REPO, 'signup', 'server', 'Code.gs'), 'utf8')

// ---- stubs -----------------------------------------------------------------
const mails = []
let props = { NOTIFY_EMAIL: 'josh_frost@sil.org' }

class Sheet {
  constructor() { this.rows = [] } // rows[r-1] = array of 10 cells
  getLastRow() { return this.rows.length }
  _cell(r, c) { const row = this.rows[r - 1] || (this.rows[r - 1] = new Array(10).fill('')); return row[c - 1] ?? '' }
  getRange(r, c, nr = 1, nc = 1) {
    const sh = this
    return {
      getValue: () => sh._cell(r, c),
      setValue: (v) => { sh._cell(r, c); sh.rows[r - 1][c - 1] = v },
      getValues: () => { const out = []; for (let i = 0; i < nr; i++) { const row = []; for (let j = 0; j < nc; j++) row.push(sh._cell(r + i, c + j)); out.push(row) } return out },
      setValues: (vals) => { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) { sh._cell(r + i, c + j); sh.rows[r + i - 1][c + j - 1] = vals[i][j] } },
    }
  }
  appendRow(vals) { const row = new Array(10).fill(''); vals.forEach((v, i) => (row[i] = v)); this.rows.push(row) }
  setFrozenRows() {}
}

const sheets = {}
const ctx = {
  console,
  SpreadsheetApp: {
    getActiveSpreadsheet: () => ({
      getSheetByName: (n) => sheets[n] || null,
      insertSheet: (n) => (sheets[n] = new Sheet()),
    }),
    flush: () => {},
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (k) => (k in props ? props[k] : null),
      setProperty: (k, v) => (props[k] = v),
    }),
  },
  LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
  MailApp: { sendEmail: (o) => mails.push(o) },
  Utilities: { formatDate: () => '2026-08-05' },
  Session: { getScriptTimeZone: () => 'UTC' },
  ContentService: {
    MimeType: { JSON: 'json', JAVASCRIPT: 'js' },
    createTextOutput: (t) => ({ t, mime: null, setMimeType(m) { this.mime = m; return this } }),
  },
}
vm.createContext(ctx)
vm.runInContext(src, ctx)

// ---- checks ----------------------------------------------------------------
let pass = 0, fail = 0
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  ok ? pass++ : fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}` + (ok ? '' : `\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`))
}
const sh = () => sheets['Sign-ups']
const post = (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).t)

eq('liveness', ctx.doGet({ parameter: {} }).t, 'Origo sign-up endpoint is live.')

eq('new sign-up', post({ email: 'A@Example.com', name: 'Ada', updates: true, beta: true, works_on: 'Tonal langs', source: 'essay' }), { ok: true, status: 'added' })
eq('  headers written', sh().rows[0], ['Received', 'Email', 'Name', 'Updates', 'Beta', 'Works on', 'Source', 'Confirmed', 'Contacted', 'Notes'])
eq('  one data row', sh().rows.length, 2)
eq('  columns', sh().rows[1].slice(1, 7), ['A@Example.com', 'Ada', true, true, 'Tonal langs', 'essay'])
// Cross-realm: a Date made inside the vm is not `instanceof Date` out here.
eq('  Confirmed stamped', typeof sh().rows[1][7]?.getTime === 'function', true)
eq('  Contacted/Notes untouched', sh().rows[1].slice(8), ['', ''])
eq('  two emails sent', mails.length, 2)
eq('  confirmation subject', mails[0].subject, "You're on the Origo list")
eq('  notification subject', mails[1].subject, 'Origo sign-up: updates + beta')

const before = mails.length
eq('duplicate, different case + boxes', post({ email: 'a@example.COM', updates: false, beta: true }), { ok: true, status: 'updated' })
eq('  still one data row', sh().rows.length, 2)
eq('  flags changed', sh().rows[1].slice(3, 5), [false, true])
eq('  blank works_on preserved', sh().rows[1][5], 'Tonal langs')
eq('  no second email', mails.length, before)

// Joshua's triage columns survive a later update
sh().rows[1][8] = 'emailed 8 Aug'
sh().rows[1][9] = 'knows Ruth project'
post({ email: 'a@example.com', updates: true, beta: true, works_on: 'Updated note' })
eq('  triage columns never clobbered', sh().rows[1].slice(8), ['emailed 8 Aug', 'knows Ruth project'])
eq('  non-blank works_on overwrites', sh().rows[1][5], 'Updated note')

const rowsBefore = sh().rows.length, mailsBefore = mails.length
eq('honeypot looks like success', post({ email: 'bot@example.com', updates: true, website: 'http://spam' }), { ok: true, status: 'added' })
eq('  wrote nothing', sh().rows.length, rowsBefore)
eq('  sent nothing', mails.length, mailsBefore)

eq('bad email', post({ email: 'nope', updates: true }), { ok: false, error: 'bad-email' })
eq('empty email', post({ updates: true }), { ok: false, error: 'bad-email' })
eq('no interest', post({ email: 'b@example.com' }), { ok: false, error: 'no-interest' })
eq('no interest, explicit false', post({ email: 'b@example.com', updates: false, beta: false }), { ok: false, error: 'no-interest' })
eq('  refusals wrote nothing', sh().rows.length, rowsBefore)
eq('malformed body', JSON.parse(ctx.doPost({ postData: { contents: '{not json' } }).t), { ok: false, error: 'bad-request' })

eq('caps name', post({ email: 'c@example.com', name: 'x'.repeat(500), updates: true }).status, 'added')
eq('  name capped at 120', sh().rows[sh().rows.length - 1][2].length, 120)

// JSONP
const jp = ctx.doGet({ parameter: { callback: 'test', email: 'a@example.com', updates: '1', beta: '0' } })
eq('JSONP wrapper', jp.t, 'test({"ok":true,"status":"updated"});')
eq('JSONP mime', jp.mime, 'js')
eq('JSONP string truthiness', sh().rows[1].slice(3, 5), [true, false])
eq('hostile callback refused', JSON.parse(ctx.doGet({ parameter: { callback: 'alert(1)//', email: 'a@example.com', updates: '1' } }).t), { ok: false, error: 'bad-callback' })
eq('GET without callback returns JSON', JSON.parse(ctx.doGet({ parameter: { email: 'a@example.com', updates: 'yes' } }).t), { ok: true, status: 'updated' })

// Daily ceiling
props.DAILY_COUNT = '2026-08-05|200'
const rowsAtCap = sh().rows.length
eq('at cap', post({ email: 'over@example.com', updates: true }), { ok: false, error: 'rate' })
eq('  wrote nothing', sh().rows.length, rowsAtCap)
props.DAILY_COUNT = '2026-08-04|200'
eq('counter resets next day', post({ email: 'over@example.com', updates: true }), { ok: true, status: 'added' })

// A failing confirmation must not fail the sign-up
ctx.MailApp.sendEmail = () => { throw new Error('quota exhausted') }
eq('mail failure still ok:true', post({ email: 'quota@example.com', updates: true }), { ok: true, status: 'added' })
eq('  Confirmed left empty', sh().rows[sh().rows.length - 1][7], '')

console.log(`\n${pass}/${pass + fail} logic checks passed.`)
process.exit(fail ? 1 : 0)
