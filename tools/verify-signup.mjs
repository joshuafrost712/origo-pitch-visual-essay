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
const record = (n, name, pass, detail) => {
  results.push({ n, name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}. ${name}${detail ? ` — ${detail}` : ''}`)
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

// 1. Liveness.
{
  const res = await fetch(URL_EXEC, { redirect: 'follow' })
  const text = await res.text()
  record(1, 'liveness string', text.includes('Origo sign-up endpoint is live.'), text.trim().slice(0, 80))
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
