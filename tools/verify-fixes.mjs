/**
 * Checks the three fixes reported on 2026-08-05:
 *   1+2. Both scroll-driven zoom figures are gone from the Work tab, and its
 *        prose is intact (nothing was left dangling where they were).
 *   3.   The trust-diagram step boxes no longer have their hover highlight
 *        clipped by the horizontally scrolling track. Measured, not eyeballed:
 *        compare each node's rect against the track's client box while hovered.
 *
 * Run: node tools/verify-fixes.mjs   (needs a dev/preview server; pass BASE)
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.BASE || 'http://localhost:5212'
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'raw-captures', 'fixes')
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

const report = {}

// ---- 1 + 2. the zoom figures are gone, the prose is not -------------------
await page.goto(`${BASE}/#/work`, { waitUntil: 'networkidle' })
await page.evaluate(async () => {
  const r = document.documentElement
  r.style.scrollBehavior = 'auto'
  for (let y = 0; y < document.body.scrollHeight; y += 420) {
    window.scrollTo(0, y)
    await new Promise((x) => setTimeout(x, 110))
  }
  window.scrollTo(0, 0)
})
await page.waitForTimeout(600)
report.workTab = await page.evaluate(() => {
  const para = (id) => document.querySelector(`[data-dfb-node="${id}"]`)?.textContent?.length ?? 0
  return {
    scrollStagesLeft: document.querySelectorAll('.scrollstage, .scrollstage-viewport').length,
    // the plain lightbox figures must survive: they were never the problem
    lightboxShots: document.querySelectorAll('.shot-frame').length,
    msFigures: document.querySelectorAll('.ms-figbtn').length,
    demos: document.querySelectorAll('.demo').length,
    prose: {
      j2p1: para('j2-p1'),
      j2payoff: para('j2-payoff'),
      j3p1: para('j3-p1'),
      j3payoff: para('j3-payoff'),
    },
    orphanCaptions: (document.body.innerText.match(/⟨missing:[^⟩]*⟩/g) || []).length,
    emptyFigcaptions: Array.prototype.slice
      .call(document.querySelectorAll('figcaption'))
      .filter((f) => f.textContent.trim().length === 0).length,
  }
})
await page.screenshot({ path: join(OUT, 'work-tab.png'), fullPage: true })

// ---- 3. the trust-diagram hover highlight is no longer clipped ------------
await page.goto(`${BASE}/#/quality`, { waitUntil: 'networkidle' })
await page.locator('.trust-diagram').scrollIntoViewIfNeeded()
await page.waitForTimeout(500)

const clipped = []
const nodeCount = await page.locator('.td-node').count()
for (let i = 0; i < nodeCount; i++) {
  const node = page.locator('.td-node').nth(i)
  await node.hover()
  await page.waitForTimeout(220)
  const m = await page.evaluate((idx) => {
    const track = document.querySelector('.td-track')
    const n = document.querySelectorAll('.td-node')[idx]
    const t = track.getBoundingClientRect()
    const r = n.getBoundingClientRect()
    return {
      // how far the hovered node pokes out of the scroll container, in px
      overTop: +(t.top - r.top).toFixed(2),
      overBottom: +(r.bottom - t.bottom).toFixed(2),
      trackScrollsVertically: track.scrollHeight > track.clientHeight + 1,
    }
  }, i)
  if (m.overTop > 0.5 || m.overBottom > 0.5 || m.trackScrollsVertically) clipped.push({ i, ...m })
}
report.trustDiagram = { nodeCount, clippedWhileHovered: clipped }

// keep a picture of the worst case: hover step 1, the left-most box
await page.locator('.td-node').first().hover()
await page.waitForTimeout(300)
await page.locator('.trust-diagram').screenshot({ path: join(OUT, 'trust-hover-first.png') })
await page.locator('.td-node').nth(2).click()
await page.locator('.td-node').nth(2).hover()
await page.waitForTimeout(300)
await page.locator('.trust-diagram').screenshot({ path: join(OUT, 'trust-hover-selected.png') })

report.errors = errors
console.log(JSON.stringify(report, null, 2))
await browser.close()
