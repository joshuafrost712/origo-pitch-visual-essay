/**
 * Verify the DEPLOYED sign-up endpoint, not a local mock.
 *
 * The whole point of the sign-up backend is that a real address lands in a real
 * sheet, so this talks to the live /exec URL and checks the behaviours that
 * would silently lose someone: a duplicate appending a second row, a honeypot
 * hit that looks different from success, a validation failure that writes
 * anyway, a JSONP path that has drifted from the POST path.
 *
 * Run: node tools/verify-signup.mjs <exec-url>
 *      node tools/verify-signup.mjs           (reads VITE_SIGNUP_URL)
 *
 * It writes ONE real test row (plus one honeypot address that must NOT appear).
 * The address is printed at the end: delete that row from the Sheet afterwards
 * so the list starts clean. Two confirmation emails are NOT expected — exactly
 * one is, on the first sign-up.
 */

const URL_EXEC = process.argv[2] || process.env.VITE_SIGNUP_URL
if (!URL_EXEC) {
  console.error('Usage: node tools/verify-signup.mjs <exec-url>   (or set VITE_SIGNUP_URL)')
  process.exit(2)
}

// Stable within a run, distinct between runs, so re-running does not trip the
// dedupe path on step 2 and report a false failure.
const STAMP = Date.now()
const TEST_EMAIL = `origo-verify-${STAMP}@example.com`
const HONEY_EMAIL = `origo-honeypot-${STAMP}@example.com`

const results = []
// Apps Script answers a blocked request with a full HTML page. Printing it raw
// buries the actual verdict under a screenful of Google's CSS.
const brief = (s) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > 140 ? `${t.slice(0, 140)}…` : t
}
const record = (n, name, pass, detail) => {
  results.push({ n, name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}. ${name}${detail ? ` — ${brief(detail)}` : ''}`)
}

/**
 * The failure worth naming before any other. A Workspace account can deploy a
 * web app that looks deployed and answers only to people already signed in to
 * that domain, which is useless for a public sign-up form. It shows up as a
 * /a/macros/<domain>/ URL and a redirect to a sign-in page.
 */
const diagnoseAccess = (url, body) => {
  const html = /<!DOCTYPE html|<html/i.test(body)
  const login = /ServiceLogin|AccountChooser|Sign in - Google Accounts/i.test(body)
  if (!html) return null
  const domainScoped = /script\.google\.com\/a\/macros\//.test(url)
  return [
    '',
    'DIAGNOSIS: this endpoint is not reachable by the public.',
    login ? '  The request was redirected to a Google sign-in page.' : '  The endpoint returned an HTML page instead of a response.',
    domainScoped
      ? `  The URL is domain-scoped (/a/macros/...), which is the form Google issues\n  when the deployment is NOT set to "Anyone". A public deployment gets the\n  plain https://script.google.com/macros/s/.../exec form.`
      : '  Check that the deployment exists and that this is the current /exec URL.',
    '  Fix: Apps Script > Deploy > Manage deployments > pencil > Who has access:',
    '  Anyone > Version: New version > Deploy. Then copy the URL again, because it',
    '  will change, and update the VITE_SIGNUP_URL repo variable.',
    '',
  ].join('\n')
}

const post = async (payload) => {
  const res = await fetch(URL_EXEC, {
    method: 'POST',
    // text/plain keeps this a simple request, so no CORS preflight. Same shape
    // the site uses.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  })
  const text = await res.text()
  try {
    return { status: res.status, body: JSON.parse(text), raw: text }
  } catch {
    return { status: res.status, body: null, raw: text }
  }
}

const getJsonp = async (params) => {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${URL_EXEC}?${qs}`, { redirect: 'follow' })
  return { status: res.status, raw: await res.text() }
}

// 1. Liveness. If this comes back as an HTML page rather than the string, every
//    check below will fail for one reason, so say the reason once and stop.
{
  const res = await fetch(URL_EXEC, { redirect: 'follow' })
  const text = await res.text()
  const live = text.includes('Origo sign-up endpoint is live.')
  record(1, 'liveness string', live, text)
  if (!live) {
    const why = diagnoseAccess(URL_EXEC, text)
    if (why) {
      console.log(why)
      console.log('Stopping: the remaining checks cannot say anything useful until the')
      console.log('endpoint answers. Nothing was written and nothing needs cleaning up.')
      process.exit(1)
    }
  }
}

// 2. A valid sign-up with both boxes ticked.
{
  const r = await post({
    email: TEST_EMAIL,
    name: 'Verify Harness',
    updates: true,
    beta: true,
    works_on: 'Automated verification of the sign-up endpoint.',
    source: 'verify-signup.mjs',
  })
  record(2, 'new sign-up added', r.body?.ok === true && r.body?.status === 'added', JSON.stringify(r.body ?? r.raw))
}

// 3. Same address again, different boxes: updated in place, no second row, no
//    second confirmation email.
{
  const r = await post({
    email: TEST_EMAIL.toUpperCase(),
    updates: false,
    beta: true,
    source: 'verify-signup.mjs',
  })
  record(3, 'duplicate updates in place', r.body?.ok === true && r.body?.status === 'updated', JSON.stringify(r.body ?? r.raw))
}

// 4. Honeypot: indistinguishable from success, writes nothing, sends nothing.
{
  const r = await post({
    email: HONEY_EMAIL,
    updates: true,
    website: 'http://spam.example',
    source: 'verify-signup.mjs',
  })
  const looksLikeSuccess = r.body?.ok === true && r.body?.status === 'added'
  record(4, 'honeypot looks like success', looksLikeSuccess, `${JSON.stringify(r.body ?? r.raw)} — confirm no row for ${HONEY_EMAIL}`)
}

// 5. Malformed email, and a payload with neither box ticked.
{
  const bad = await post({ email: 'not-an-email', updates: true })
  record(5.1, 'malformed email refused', bad.body?.ok === false && bad.body?.error === 'bad-email', JSON.stringify(bad.body ?? bad.raw))

  const none = await post({ email: `origo-nointerest-${STAMP}@example.com`, updates: false, beta: false })
  record(5.2, 'no interest refused', none.body?.ok === false && none.body?.error === 'no-interest', JSON.stringify(none.body ?? none.raw))
}

// 6. The JSONP doGet path behaves identically to POST.
{
  const r = await getJsonp({ callback: 'test', email: TEST_EMAIL, updates: '1', beta: '0', source: 'verify-signup.mjs' })
  const wrapped = /^test\(\{.*\}\);?\s*$/.test(r.raw.trim())
  let parsed = null
  try {
    parsed = JSON.parse(r.raw.trim().replace(/^test\(/, '').replace(/\);?$/, ''))
  } catch { /* left null, reported below */ }
  record(6.1, 'JSONP is well formed', wrapped, r.raw.trim().slice(0, 120))
  record(6.2, 'JSONP matches POST behaviour', parsed?.ok === true && parsed?.status === 'updated', JSON.stringify(parsed))

  const badCb = await getJsonp({ callback: 'alert(1)//', email: TEST_EMAIL, updates: '1' })
  record(6.3, 'hostile callback refused', badCb.raw.includes('bad-callback'), badCb.raw.trim().slice(0, 120))
}

const failed = results.filter((r) => !r.pass)
console.log('')
console.log(`${results.length - failed.length}/${results.length} checks passed.`)
console.log('')
console.log('Manual, in the Sheet and your inbox:')
console.log(`  - exactly ONE row for ${TEST_EMAIL}, with Confirmed stamped`)
console.log(`  - NO row for ${HONEY_EMAIL}`)
console.log('  - one confirmation email, one notification email, and no second pair from step 3')
console.log(`  - then delete the ${TEST_EMAIL} row so the list starts clean`)
process.exit(failed.length ? 1 : 0)
