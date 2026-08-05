/**
 * Presentation-build verification (spec: Website Spec — Presentation Build,
 * 2026-08-04, item 7). Distinct from verify.mjs, which exercises the dev-only
 * feedback tooling: this one checks the things a person on stage will see.
 *
 *   1. All six tabs at three widths, screenshotted full-page and eyeballed.
 *   2. Missing-content probe on every tab (the `⟨missing: id.field⟩` marker).
 *   3. No horizontal overflow at any width.
 *   4. The vision scenes: both lanes present, and the shared trigger fires.
 *   5. Reduced motion: the static branch renders (dashed ghosts present from
 *      the start, flow paths already drawn, nothing left at opacity 0).
 *   6. The quality map: 24 components, the expected 15/4/5 state split, and a
 *      component expands to its coverage-limit prose.
 *
 * Run: node tools/verify-presentation.mjs   (needs `vite dev` on :5199)
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.BASE || 'http://localhost:5199'
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'raw-captures', 'presentation')
mkdirSync(OUT, { recursive: true })

const TABS = ['story', 'work', 'engine', 'quality', 'road', 'together']
const WIDTHS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'phone', width: 390, height: 844 },
]

const browser = await chromium.launch()
const report = { missing: {}, overflow: {}, errors: [] }

/**
 * Sweep the page so every in-view trigger fires.
 *
 * `html { scroll-behavior: smooth }` is the trap here: a burst of scrollTo calls
 * interrupt each other's animations, so the page never actually settles anywhere
 * and IntersectionObserver callbacks that should fire never do. That looks
 * exactly like a broken trigger. Force `auto` for the duration of the sweep.
 */
const scrollThrough = (page) =>
  page.evaluate(async () => {
    const root = document.documentElement
    const prev = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    for (let y = 0; y < document.body.scrollHeight; y += 420) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 130))
    }
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 120))
    root.style.scrollBehavior = prev
  })

// ---- 1-3. every tab, every width -------------------------------------------
for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: w, deviceScaleFactor: 2 })
  page.on('pageerror', (e) => report.errors.push(`${w.name}: ${String(e)}`))
  page.on('console', (m) => m.type() === 'error' && report.errors.push(`${w.name}: ${m.text()}`))
  for (const tab of TABS) {
    await page.goto(`${BASE}/#/${tab}`, { waitUntil: 'networkidle' })
    await scrollThrough(page)
    await page.waitForTimeout(500)
    const found = await page.evaluate(
      () => document.body.innerText.match(/⟨missing:[^⟩]*⟩/g) || [],
    )
    if (found.length) report.missing[`${w.name}/${tab}`] = found
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    )
    if (over) report.overflow[`${w.name}/${tab}`] = true
    await page.screenshot({ path: join(OUT, `${w.name}-${tab}.png`), fullPage: true })
  }
  await page.close()
}

// ---- 4. vision scenes, animated --------------------------------------------
const page = await browser.newPage({ viewport: WIDTHS[0], deviceScaleFactor: 2 })
await page.goto(`${BASE}/#/story`, { waitUntil: 'networkidle' })
await scrollThrough(page)
await page.waitForTimeout(900)
report.scenes = await page.evaluate(() => {
  const lanes = [...document.querySelectorAll('.vs-lanes')]
  return {
    count: lanes.length,
    triggered: lanes.filter((l) => l.classList.contains('on')).length,
    lanesPerScene: lanes.map((l) => l.querySelectorAll('.vs-lane').length),
    withLane: lanes.filter((l) => l.querySelector('.vs-lane--with')).length,
    srDescriptions: lanes.filter((l) => (l.querySelector('.vs-sr-only')?.innerText || '').length > 60)
      .length,
  }
})
await page.locator('#gap .vs-lanes').screenshot({ path: join(OUT, 'scene1-animated.png') })
await page.locator('#vision2 .vs-lanes').screenshot({ path: join(OUT, 'scene2-animated.png') })
await page.locator('#vision3 .vs-lanes').screenshot({ path: join(OUT, 'scene3-animated.png') })
await page.goto(`${BASE}/#/road`, { waitUntil: 'networkidle' })
await scrollThrough(page)
await page.waitForTimeout(900)
await page.locator('#teamvision .vs-lanes').screenshot({ path: join(OUT, 'scene4-animated.png') })

// ---- 6. quality map ---------------------------------------------------------
await page.goto(`${BASE}/#/quality`, { waitUntil: 'networkidle' })
await scrollThrough(page)
await page.waitForTimeout(400)
report.quality = await page.evaluate(() => {
  const comps = [...document.querySelectorAll('.qm-comp')]
  const stateOf = (el) =>
    ['verified', 'partial', 'gap', 'planned'].find((s) => el.classList.contains(`qm-comp--${s}`))
  const counts = {}
  comps.forEach((c) => {
    const s = stateOf(c)
    counts[s] = (counts[s] ?? 0) + 1
  })
  return {
    stages: document.querySelectorAll('.qm-stage').length,
    components: comps.length,
    counts,
    legendItems: document.querySelectorAll('.qm-legend__item').length,
    trustSectionPresent: !!document.getElementById('trust'),
    trustNodes: document.querySelectorAll('.td-node').length,
  }
})
// expand one gap component and confirm its prose appears
const gap = page.locator('.qm-comp--gap .qm-comp__head').first()
await gap.scrollIntoViewIfNeeded()
await gap.click()
await page.waitForTimeout(250)
report.quality.gapBodyChars = (await page.locator('.qm-comp--gap .qm-comp__body p').first().innerText())
  .length
await page.locator('.qm').screenshot({ path: join(OUT, 'quality-map.png') })
await page.locator('.qm-legend').screenshot({ path: join(OUT, 'quality-legend.png') })

// engine's two-column honest state block
await page.goto(`${BASE}/#/engine`, { waitUntil: 'networkidle' })
await scrollThrough(page)
// The stat row counts up over 1400ms, so reading it too early reports a number
// that is neither the old value nor the new one. Wait for it to settle.
await page.locator('#engine .stats').scrollIntoViewIfNeeded()
await page.waitForTimeout(2200)
report.stateBlock = await page.evaluate(() => ({
  columns: document.querySelectorAll('.st-col').length,
  now: document.querySelectorAll('.st-col--now .st-item').length,
  rest: document.querySelectorAll('.st-col--rest .st-item').length,
  stats: [...document.querySelectorAll('.stat .num')].map((n) => n.innerText),
}))
await page.locator('#state .st-split').screenshot({ path: join(OUT, 'state-split.png') })
await page.close()

// ---- 5. reduced motion ------------------------------------------------------
const rmPage = await browser.newPage({
  viewport: WIDTHS[0],
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
})
await rmPage.goto(`${BASE}/#/story`, { waitUntil: 'networkidle' })
await scrollThrough(rmPage)
await rmPage.waitForTimeout(600)
report.reducedMotion = await rmPage.evaluate(() => {
  const lanes = [...document.querySelectorAll('.vs-lanes')]
  const invisible = []
  lanes.forEach((l, i) => {
    l.querySelectorAll('.vs-chip, .vs-card, .vs-flow, .vs-store').forEach((el) => {
      if (Number(getComputedStyle(el).opacity) < 0.9) invisible.push(`scene${i + 1}:${el.getAttribute('class')}`)
    })
  })
  return {
    staticBranch: lanes.filter((l) => l.classList.contains('vs-static')).length,
    triggeredAnyway: lanes.filter((l) => l.classList.contains('on')).length,
    // the static frame's whole point: dashed ghosts are present without motion
    lostChips: document.querySelectorAll('.vs-chip--lost').length,
    keptChips: document.querySelectorAll('.vs-chip--kept').length,
    invisibleElements: invisible.slice(0, 8),
  }
})
await rmPage.locator('#gap .vs-lanes').screenshot({ path: join(OUT, 'scene1-reduced.png') })
await rmPage.locator('#vision3 .vs-lanes').screenshot({ path: join(OUT, 'scene3-reduced.png') })
await rmPage.goto(`${BASE}/#/road`, { waitUntil: 'networkidle' })
await scrollThrough(rmPage)
await rmPage.waitForTimeout(400)
await rmPage.locator('#teamvision .vs-lanes').screenshot({ path: join(OUT, 'scene4-reduced.png') })
await rmPage.close()

await browser.close()
console.log(JSON.stringify(report, null, 2))
console.log('\nshots -> ' + OUT)
