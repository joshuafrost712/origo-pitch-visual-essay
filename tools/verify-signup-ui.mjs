/**
 * Verify the "Getting involved" section in the browser, by measurement rather
 * than by eye (spec: Website Spec — Getting Involved Section, 2026-08-05).
 *
 * NAME: the spec called this tools/verify-signup.mjs, but that name was already
 * taken by the paired backend spec's harness, which checks the LIVE Apps Script
 * endpoint and is referenced by name from the vault runbook. The two are
 * complementary and both are meant to be run:
 *
 *   verify-signup.mjs     — the deployed endpoint: rows, dedupe, honeypot, JSONP
 *   verify-signup-ui.mjs  — this file: the section, the form, and a11y in a page
 *
 * It manages its own dev servers, because the one case most worth testing is the
 * one where VITE_SIGNUP_URL is UNSET, and that cannot be checked on the same
 * server as everything else. Two ports:
 *
 *   :5197  VITE_SIGNUP_URL set to an unreachable host. Every check below runs
 *          here. Client-side validation short-circuits before any request, so
 *          the refusal checks touch no network at all, and the one check that
 *          does reach for the network is asserting that an unreachable endpoint
 *          reports failure rather than a success it cannot back up.
 *   :5196  VITE_SIGNUP_URL unset. The mailto-degradation check.
 *
 * Deliberately never points at the real endpoint: a harness must not be able to
 * write a row into Joshua's sign-up sheet.
 *
 * Run: node tools/verify-signup-ui.mjs
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'tools', 'raw-captures', 'signup')
mkdirSync(OUT, { recursive: true })

// A host that cannot resolve, so a submit fails fast and writes nothing anywhere.
const DEAD_ENDPOINT = 'https://origo-signup.invalid/exec'
const PORT_SET = 5197
const PORT_UNSET = 5196

const WIDTHS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'phone', width: 390, height: 844 },
]

// Expected strings come from the content file, so what this asserts is that the
// right NODE is chosen for each state. A copy edit moves both together; picking
// the wrong node for a state still fails.
const content = JSON.parse(readFileSync(join(ROOT, 'src/content/essay-content.json'), 'utf8'))
const byId = new Map()
;(function walk(nodes) {
  for (const n of nodes) {
    byId.set(n.id, n)
    if (n.children) walk(n.children)
  }
})(content.sections)
const copy = (id, field = 'text') => byId.get(id)?.[field] ?? `⟨missing: ${id}.${field}⟩`

const results = []
const record = (n, name, pass, detail) => {
  results.push({ n, name, pass, detail })
  const brief = String(detail ?? '').replace(/\s+/g, ' ').trim().slice(0, 150)
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}. ${name}${brief ? ` — ${brief}` : ''}`)
}

// ------------------------------------------------------------- dev servers
function startVite(port, env) {
  const proc = spawn('npx', ['vite', '--port', String(port), '--strictPort'], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: 'ignore',
  })
  return proc
}

async function waitForServer(port, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${port}/`)
      if (res.ok) return true
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`vite on :${port} did not come up`)
}

// `VITE_SIGNUP_URL: undefined` in a spread does not remove an inherited value,
// so delete it explicitly or the unset case silently tests the wrong thing.
const envWithout = () => {
  const e = { ...process.env }
  delete e.VITE_SIGNUP_URL
  return e
}

const servers = [
  startVite(PORT_SET, { VITE_SIGNUP_URL: DEAD_ENDPOINT }),
  spawn('npx', ['vite', '--port', String(PORT_UNSET), '--strictPort'], {
    cwd: ROOT,
    env: envWithout(),
    stdio: 'ignore',
  }),
]
const shutdown = () => servers.forEach((p) => !p.killed && p.kill('SIGTERM'))
process.on('exit', shutdown)

let browser
try {
  await Promise.all([waitForServer(PORT_SET), waitForServer(PORT_UNSET)])
  browser = await chromium.launch()

  const BASE = `http://localhost:${PORT_SET}`
  const page = await browser.newPage({ viewport: WIDTHS[0], deviceScaleFactor: 2 })
  const pageErrors = []
  // Check 5.3 deliberately posts to an unresolvable host, so the browser logs a
  // failed-resource error every time. That one is the point of the test, not a
  // defect, so it is filtered rather than allowed to fail check 8.
  const expected = (text) => /ERR_NAME_NOT_RESOLVED|origo-signup\.invalid/.test(text)
  page.on('pageerror', (e) => !expected(String(e)) && pageErrors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !expected(m.text()) && pageErrors.push(m.text()))

  /**
   * Wait out the reveal-on-scroll cascade before reading opacity or taking a
   * screenshot. `.reveal > *` stagger delays run to 480ms on top of a 650ms
   * transition, so anything shot earlier than that catches the section mid-fade
   * and looks like a rendering bug that is not there.
   */
  const settle = (p) => p.waitForTimeout(1400)

  /**
   * A genuine reload, so each check starts on an empty form. `goto` to a URL that
   * differs from the current one only by its hash is a same-document navigation:
   * React state survives it, and a ticked box leaks from the previous check into
   * the next one. That once made a passing no-interest refusal look like a
   * network failure.
   */
  const reload = async () => {
    await page.goto(`${BASE}/#/together`, { waitUntil: 'networkidle' })
    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('#involved').scrollIntoViewIfNeeded()
    await page.waitForTimeout(250)
  }
  await reload()

  // ---- 1. the section exists, on the right tab, in the right place ---------
  {
    const order = await page.evaluate(() =>
      [...document.querySelectorAll('main section.section')].map((s) => s.id),
    )
    const [i, v, a] = ['interop', 'involved', 'about'].map((id) => order.indexOf(id))
    record(
      1.1,
      'involved section renders on the Together tab',
      v >= 0,
      `section order: ${order.join(' → ')}`,
    )
    record(1.2, 'placed between interop and about', i >= 0 && a >= 0 && i < v && v < a, `interop=${i} involved=${v} about=${a}`)

    // textContent, not innerText: the kicker is uppercased by CSS, and innerText
    // returns the transformed text, so innerText would never match the source copy.
    const heading = await page.locator('#involved h2').textContent()
    const kicker = await page.locator('#involved .kicker').textContent()
    record(
      1.3,
      'kicker and heading are the approved copy',
      kicker.trim() === copy('involved-kicker', 'kicker') && heading.trim() === copy('involved-heading', 'heading'),
      `${kicker.trim()} / ${heading.trim()}`,
    )
    const missing = await page.evaluate(
      () => document.querySelector('#involved')?.innerText.match(/⟨missing:[^⟩]*⟩/g) || [],
    )
    record(1.4, 'no missing content nodes in the section', missing.length === 0, missing.join(', '))

    // The reveal-on-scroll cascade starts every child at opacity 0. A section
    // that never gets its `.in` class, or a stray opacity rule, leaves a panel
    // faded or blank while every content check above still passes. This site has
    // shipped that bug once before, so it is measured rather than eyeballed.
    await settle(page)
    const faded = await page.evaluate(() => {
      const out = []
      document
        .querySelectorAll('#involved, #involved .su-offer, #involved .su, #involved .su-btn, #involved .su-input, #involved .su-label')
        .forEach((el) => {
          const o = Number(getComputedStyle(el).opacity)
          if (o < 0.9) out.push(`${el.className || el.id}=${o}`)
        })
      return out
    })
    record(1.5, 'section is fully opaque once the reveal has settled', faded.length === 0, faded.join(', '))
  }

  // ---- 2. labels and the live region --------------------------------------
  {
    const a11y = await page.evaluate(() => {
      const fields = [...document.querySelectorAll('#involved input, #involved textarea')]
      return {
        count: fields.length,
        unlabelled: fields.filter((f) => !f.labels || f.labels.length === 0).map((f) => f.name || f.type),
        emailType: document.querySelector('#involved input[name="email"]')?.type,
        emailRequired: document.querySelector('#involved input[name="email"]')?.required,
        emailAutocomplete: document.querySelector('#involved input[name="email"]')?.autocomplete,
        nameAutocomplete: document.querySelector('#involved input[name="name"]')?.autocomplete,
        liveRegion: !!document.querySelector('#involved .su-status[aria-live="polite"]'),
        describedBy: (() => {
          const el = document.querySelector('#involved input[name="email"]')
          const id = el?.getAttribute('aria-describedby')
          const target = id && document.getElementById(id)
          return target ? target.innerText.trim() : null
        })(),
      }
    })
    record(2.1, 'every input has an associated label', a11y.unlabelled.length === 0, `${a11y.count} fields; unlabelled: ${a11y.unlabelled.join(', ') || 'none'}`)
    record(2.2, 'email input is type=email, required, autocompleted', a11y.emailType === 'email' && a11y.emailRequired === true && a11y.emailAutocomplete === 'email', `type=${a11y.emailType} required=${a11y.emailRequired} autocomplete=${a11y.emailAutocomplete}`)
    record(2.3, 'name input autocompletes', a11y.nameAutocomplete === 'name', String(a11y.nameAutocomplete))
    record(2.4, 'status region is aria-live=polite', a11y.liveRegion === true)
    record(2.5, 'privacy line is wired to the email field', a11y.describedBy === copy('su-privacy'), a11y.describedBy)
  }

  // ---- 3. the conditional field ------------------------------------------
  {
    const worksSel = '#involved textarea[name="works_on"]'
    const before = await page.locator(worksSel).count()
    await page.locator('#involved input[name="beta"]').check()
    await page.waitForTimeout(150)
    const after = await page.locator(worksSel).count()
    const label = after ? await page.locator(`#involved label[for="${await page.locator(worksSel).getAttribute('id')}"]`).innerText() : ''
    record(3.1, 'works-on field is absent until the beta box is ticked', before === 0, `count before = ${before}`)
    record(3.2, 'works-on field appears once ticked', after === 1, `count after = ${after}`)
    record(3.3, 'works-on carries the approved label and placeholder', label.trim() === copy('su-works-label', 'label') && (await page.locator(worksSel).getAttribute('placeholder')) === copy('su-works-placeholder', 'label'), label.trim())
    await page.locator('#involved input[name="beta"]').uncheck()
    await page.waitForTimeout(150)
    record(3.4, 'works-on field disappears again when unticked', (await page.locator(worksSel).count()) === 0)
  }

  // ---- 4. the honeypot ----------------------------------------------------
  {
    const honey = await page.evaluate(() => {
      const el = document.querySelector('#involved input[name="website"]')
      if (!el) return null
      const cs = getComputedStyle(el)
      const box = el.getBoundingClientRect()
      return {
        tabIndex: el.tabIndex,
        hidden: el.closest('[aria-hidden="true"]') !== null,
        offscreen: box.right < 0 || box.bottom < 0 || cs.visibility === 'hidden' || cs.display === 'none',
      }
    })
    record(4.1, 'honeypot exists, hidden from assistive tech and off-screen', honey !== null && honey.hidden && honey.offscreen, JSON.stringify(honey))

    // Measured, not asserted from the attribute: walk the tab order from the
    // email field and check the honeypot is never focused.
    await page.locator('#involved input[name="email"]').focus()
    const visited = []
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      visited.push(await page.evaluate(() => document.activeElement?.getAttribute('name') || document.activeElement?.tagName))
    }
    record(4.2, 'honeypot is not reachable by keyboard', honey?.tabIndex === -1 && !visited.includes('website'), `tab order: ${visited.join(' → ')}`)
  }

  // ---- 5. client-side refusals, each with the right message ---------------
  {
    const status = () => page.locator('#involved .su-status').innerText()

    await reload()
    await page.locator('#involved input[name="email"]').fill('not-an-email')
    await page.locator('#involved input[name="updates"]').check()
    await page.locator('#involved .su-btn').click()
    await page.waitForTimeout(300)
    record(5.1, 'malformed email refused with the right message', (await status()).trim() === copy('su-bad-email'), await status())

    await reload()
    await page.locator('#involved input[name="email"]').fill('reader@example.com')
    await page.locator('#involved .su-btn').click()
    await page.waitForTimeout(300)
    record(5.2, 'submit with neither box ticked refused with the right message', (await status()).trim() === copy('su-no-interest'), await status())

    // The load-bearing rule: an endpoint that cannot be reached must never read
    // as success. This one really does try the network, at an unresolvable host.
    await reload()
    await page.locator('#involved input[name="email"]').fill('reader@example.com')
    await page.locator('#involved input[name="updates"]').check()
    await page.locator('#involved .su-btn').click()
    await page.waitForTimeout(1200)
    await page.waitForFunction(
      () => !document.querySelector('#involved .su-status')?.classList.contains('su-status--pending'),
      null,
      { timeout: 25000 },
    )
    const failText = (await status()).trim()
    const okShown = await page.locator('#involved .su-status--ok').count()
    const mailto = await page.locator('#involved .su-mailto').count()
    const formStill = await page.locator('#involved form').count()
    record(5.3, 'unreachable endpoint reports failure, never success', failText === copy('su-failed') && okShown === 0, failText)
    record(5.4, 'failure offers the mailto and keeps the form', mailto === 1 && formStill === 1, `mailto=${mailto} form=${formStill}`)

    // Validation messages appear only after a submit attempt, not while typing.
    await reload()
    await page.locator('#involved input[name="email"]').pressSequentially('nope', { delay: 30 })
    await page.waitForTimeout(250)
    record(5.5, 'no validation message while typing', (await status()).trim() === '', await status())
  }

  // ---- 6. screenshots + overflow at three widths --------------------------
  {
    const overflow = {}
    for (const w of WIDTHS) {
      const p = await browser.newPage({ viewport: w, deviceScaleFactor: 2 })
      await p.goto(`${BASE}/#/together`, { waitUntil: 'networkidle' })
      await p.locator('#involved').scrollIntoViewIfNeeded()
      await settle(p)
      overflow[w.name] = await p.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      )
      await p.locator('#involved').screenshot({ path: join(OUT, `${w.name}-involved.png`) })
      // and with the conditional field open, which is the widest the form gets
      await p.locator('#involved input[name="beta"]').check()
      await p.waitForTimeout(200)
      await p.locator('#involved .su').screenshot({ path: join(OUT, `${w.name}-form-beta.png`) })
      await p.close()
    }
    const bad = Object.entries(overflow).filter(([, v]) => v).map(([k]) => k)
    record(6, 'no horizontal overflow at 1440 / 834 / 390', bad.length === 0, bad.length ? `overflows: ${bad.join(', ')}` : 'clean at all three')
  }

  // ---- 7. the three success strings, against a stubbed endpoint -----------
  // Interception rather than the live endpoint, so the mapping from the
  // endpoint's {ok, status} onto the reader-facing wording is checked without a
  // harness ever being able to write a row into Joshua's sheet.
  {
    let stub = { ok: true, status: 'added' }
    await page.route('**/origo-signup.invalid/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(stub),
      }),
    )

    const submit = async ({ beta }) => {
      await reload()
      await page.locator('#involved input[name="email"]').fill('reader@example.com')
      await page.locator(`#involved input[name="${beta ? 'beta' : 'updates'}"]`).check()
      if (beta) await page.locator('#involved textarea[name="works_on"]').fill('Psalms, Bantu languages.')
      await page.locator('#involved .su-btn').click()
      await page.waitForTimeout(500)
      return {
        text: (await page.locator('#involved .su-status').innerText()).trim(),
        forms: await page.locator('#involved form').count(),
        ok: await page.locator('#involved .su-status--ok').count(),
        mailto: await page.locator('#involved .su-mailto').count(),
      }
    }

    const updatesOnly = await submit({ beta: false })
    record(7.1, 'added, updates only: the right confirmation', updatesOnly.text === copy('su-added-updates') && updatesOnly.ok === 1, updatesOnly.text)
    record(7.2, 'success replaces the form, so no double submit', updatesOnly.forms === 0 && updatesOnly.mailto === 0, `forms=${updatesOnly.forms} mailto=${updatesOnly.mailto}`)
    await settle(page)
    await page.locator('#involved .su').screenshot({ path: join(OUT, 'desktop-confirmed.png') })

    const withBeta = await submit({ beta: true })
    record(7.3, 'added with beta ticked: the beta confirmation', withBeta.text === copy('su-added-beta') && withBeta.ok === 1, withBeta.text)

    stub = { ok: true, status: 'updated' }
    const already = await submit({ beta: false })
    record(7.4, 'already on the list: the updated wording', already.text === copy('su-already') && already.ok === 1, already.text)

    // An endpoint answering with a shape we do not recognise must read as
    // failure. This is the rule the whole spec is built around.
    for (const [n, body, label] of [
      [7.5, { ok: true }, 'ok:true with no status'],
      [7.6, { ok: true, status: 'weird' }, 'an unknown status'],
      [7.7, { hello: 'world' }, 'a shape with no ok field'],
      [7.8, { ok: false, error: 'rate' }, 'a rate refusal'],
    ]) {
      stub = body
      const r = await submit({ beta: false })
      record(n, `${label} reads as failure, not success`, r.text === copy('su-failed') && r.ok === 0 && r.forms === 1, r.text)
    }

    await page.unroute('**/origo-signup.invalid/**')
  }

  await page.close()

  // ---- 8. THE case that keeps a premature ship honest --------------------
  {
    const p = await browser.newPage({ viewport: WIDTHS[0], deviceScaleFactor: 2 })
    await p.goto(`http://localhost:${PORT_UNSET}/#/together`, { waitUntil: 'networkidle' })
    await p.locator('#involved').scrollIntoViewIfNeeded()
    await settle(p)
    const state = await p.evaluate(() => ({
      forms: document.querySelectorAll('#involved form').length,
      inputs: document.querySelectorAll('#involved input, #involved textarea').length,
      mailto: document.querySelector('#involved .su-mailto')?.getAttribute('href'),
      status: document.querySelector('#involved .su-status')?.innerText.trim(),
      sectionPresent: !!document.getElementById('involved'),
    }))
    record(8.1, 'unset endpoint: no form and no inputs render', state.forms === 0 && state.inputs === 0, JSON.stringify(state))
    record(8.2, 'unset endpoint: the mailto invitation renders instead', state.mailto === 'mailto:josh_frost@sil.org' && state.status === copy('su-unconfigured'), `${state.mailto} / ${state.status}`)
    record(8.3, 'unset endpoint: the section itself still renders', state.sectionPresent === true)
    await p.locator('#involved').screenshot({ path: join(OUT, 'unconfigured-involved.png') })
    await p.close()
  }

  record(9, 'no console or page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '))
} finally {
  if (browser) await browser.close()
  shutdown()
}

const failed = results.filter((r) => !r.pass)
console.log('')
console.log(`${results.length - failed.length}/${results.length} checks passed.`)
console.log(`shots -> ${OUT}`)
process.exit(failed.length ? 1 : 0)
