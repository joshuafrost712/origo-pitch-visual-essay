/**
 * Screenshot pass against the live local Origo app (http://127.0.0.1:8077).
 * Writes raw captures to tools/raw-captures/ (gitignored). Every image is
 * reviewed by hand (scrub pass) before anything is copied into src/assets/.
 *
 * Run: node tools/capture.mjs [--only name1,name2]
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'http://127.0.0.1:8077'
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'raw-captures')
mkdirSync(OUT, { recursive: true })

const only = (() => {
  const i = process.argv.indexOf('--only')
  return i === -1 ? null : new Set(process.argv[i + 1].split(','))
})()

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
})

async function shot(name, fn, opts = {}) {
  if (only && !only.has(name)) return
  try {
    await fn()
    await page.waitForTimeout(opts.settle ?? 800)
    await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: opts.fullPage ?? false })
    console.log(`ok  ${name}`)
  } catch (err) {
    console.log(`ERR ${name}: ${String(err).split('\n')[0]}`)
  }
}

const waitText = (sel, min = 100, timeout = 45000) =>
  page.waitForFunction(
    ([s, m]) => {
      const el = document.querySelector(s)
      return el && el.textContent.trim().length > m
    },
    [sel, min],
    { timeout },
  )

// ---- Search: lemma query results (Journey 1) -------------------------------
await shot('search-lemma-results', async () => {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  // The lemma field lives inside a collapsed sidebar group — open its ancestors.
  await page.evaluate(() => {
    let p = document.getElementById('q-lemma')?.closest('details')
    while (p) {
      p.open = true
      p = p.parentElement?.closest('details') ?? null
    }
  })
  await page.fill('#q-lemma', 'μαρτυρέω')
  await page.waitForTimeout(600)
  await page.click('#run')
  await page.waitForFunction(() => {
    const r = document.getElementById('results-list')
    return r && !/searching/i.test(r.textContent || '') && r.children.length > 0
  }, { timeout: 20000 })
})

// ---- Search: reader open on a result (Journey 1) ---------------------------
await shot('search-reader', async () => {
  await page.locator('#results-list .result-title-bar a').first().click()
  await waitText('#reader-box')
})

// ---- Passage hub lanes on a locus ------------------------------------------
await shot('passage-hub', async () => {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await page.fill('#q-locus', 'Mark 1:4')
  await page.waitForTimeout(1500)
  await page.waitForFunction(() => {
    const p = document.getElementById('hub-parallels')
    return p && !/loading/i.test(p.textContent || '')
  }, { timeout: 12000 })
})

// ---- Structure viewer: Greek (Mark 1) --------------------------------------
await shot('structure-mark1', async () => {
  await page.goto(BASE + '/structure', { waitUntil: 'domcontentloaded' })
  await page.fill('#pass', 'Mark 1:1-15')
  await page.click('#go')
  await waitText('#text')
}, { settle: 1200 })

// ---- Structure viewer: Hebrew (Psalm 23) -----------------------------------
await shot('structure-psalm23', async () => {
  await page.goto(BASE + '/structure', { waitUntil: 'domcontentloaded' })
  await page.fill('#pass', 'Psalm 23')
  await page.click('#go')
  await waitText('#text')
}, { settle: 1200 })

// ---- Soundscape: Matthew 6 (the gold passage) -------------------------------
await shot('soundscape-matt6', async () => {
  await page.goto(BASE + '/soundscape', { waitUntil: 'domcontentloaded' })
  await page.fill('#pass', 'Matthew 6:1-13')
  await page.click('#go')
  await waitText('#text')
}, { settle: 1200 })

// ---- Artistry suite ----------------------------------------------------------
await shot('artistry-mark1', async () => {
  await page.goto(BASE + '/artistry', { waitUntil: 'domcontentloaded' })
  const pass = page.locator('#pass')
  if (await pass.count()) {
    await pass.fill('Mark 1:1-15')
    await page.click('#go')
    await waitText('#text')
  }
}, { settle: 1500 })

// ---- Editions viewer ---------------------------------------------------------
await shot('editions-mark1', async () => {
  await page.goto(
    BASE + '/editions?set=mark1-otn&doc=' + encodeURIComponent('edition/MRK-01-04.md'),
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForTimeout(1500)
})

// ---- Tiled workspace ----------------------------------------------------------
// NOT `?layout=demo`: that layout opens the `editions` viewer, whose tab label in
// the app is "Aquifer Editions", and no Aquifer label may ship on the public
// essay (2026-08-04 spec, item 6). So the layout is seeded through the shell's
// own saved-workspace key instead, which is a real workspace a real user could
// arrange, not a mock. Search + Notes beside Reports / Research / Artistry.
await shot('app-workspace', async () => {
  await page.goto(BASE + '/app', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    const mk = (v, i) => ({ id: 't' + i, viewer: v })
    const a = [mk('search', 1), mk('notes', 2)]
    const b = [mk('research', 3), mk('reports', 4), mk('artistry', 5)]
    localStorage.setItem(
      'origo.workspace.v2',
      JSON.stringify({
        activePane: 'pA',
        panes: [
          { id: 'pA', flex: 1.15, activeTab: 't1', tabs: a },
          { id: 'pB', flex: 1, activeTab: 't4', tabs: b },
        ],
      }),
    )
  })
  await page.goto(BASE + '/app', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4500)
  // Run a real query inside the search pane's iframe so the workspace shot shows
  // the tool doing something rather than an empty results column.
  const search = page.frames().find((f) => new URL(f.url()).pathname === '/')
  if (search) {
    // Set + run through the DOM rather than through the pointer: inside a narrow
    // workspace pane the filter rail auto-collapses, so `fill()` would wait
    // forever on a field that is real but not visible.
    await search.evaluate(() => {
      let p = document.getElementById('q-lemma')?.closest('details')
      while (p) {
        p.open = true
        p = p.parentElement?.closest('details') ?? null
      }
      const el = document.getElementById('q-lemma')
      if (el) {
        el.value = 'μαρτυρέω'
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
      }
      document.getElementById('run')?.click()
    })
    await search
      .waitForFunction(
        () => {
          const r = document.getElementById('results-list')
          return r && !/searching/i.test(r.textContent || '') && r.children.length > 0
        },
        null,
        { timeout: 20000 },
      )
      .catch(() => {})
  }
}, { settle: 2000 })

// ---- Coach (landing state; no real transcripts) -------------------------------
await shot('coach-landing', async () => {
  await page.goto(BASE + '/coach', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
})

// ---- Commentaries portal (landing; scrub review decides if usable) ------------
await shot('commentaries-landing', async () => {
  await page.goto(BASE + '/commentaries', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
})

await browser.close()
console.log('done -> ' + OUT)
