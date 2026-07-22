/**
 * End-to-end verification of the essay page + dev mode against a running
 * `vite dev` server. Screenshots go to tools/raw-captures/verify-*.png.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.BASE || 'http://localhost:5199'
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'raw-captures')
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

await page.goto(BASE + '/', { waitUntil: 'networkidle' })

// 1. Full-page render after forcing all reveals (scroll through)
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) {
    window.scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 60))
  }
  window.scrollTo(0, 0)
})
await page.waitForTimeout(800)

// missing-content placeholders?
const missing = await page.evaluate(() => document.body.innerText.match(/⟨missing:[^⟩]*⟩/g) || [])

// 2. Search demo: click Search, expect result cards
await page.locator('.sd-btn').click()
await page.waitForSelector('.sd-card', { timeout: 5000 })
const cardCount = await page.locator('.sd-card').count()
await page.locator('#journey1').screenshot({ path: join(OUT, 'verify-journey1.png') })

// 3. Soundscape demo: select the paronomasia finding, expect highlighted tokens
const parono = page.locator('.ss-hit', { hasText: 'similar-sounding' }).first()
await parono.scrollIntoViewIfNeeded()
await parono.click()
await page.waitForTimeout(400)
const litCount = await page.locator('.ss-tok.hl').count()
await page.locator('#journey3 .demo').screenshot({ path: join(OUT, 'verify-soundscape.png') })

// 4. Hero + engine stats screenshots
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(500)
await page.screenshot({ path: join(OUT, 'verify-hero.png') })
await page.locator('#engine .stats').scrollIntoViewIfNeeded()
await page.waitForTimeout(1800)
await page.locator('#engine').screenshot({ path: join(OUT, 'verify-engine.png') })

// 5. Dev feedback: select text, expect Comment/Edit buttons, submit an edit round-trip via fetch
const devProbe = await page.evaluate(async () => {
  // comment inbox
  const fb = await fetch('/__feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'verify-probe.md', markdown: '# probe\nverification round-trip' }),
  })
  // content edit: change hero-scroll label and change it back
  const edit = (oldText, newText) =>
    fetch('/__content-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: 'hero-scroll', field: 'label', oldText, newText }),
    }).then((r) => r.status)
  const s1 = await edit('Scroll', 'Scroll down')
  const s2 = await edit('Scroll down', 'Scroll')
  const stale = await edit('WRONG-OLD-TEXT', 'x')
  return { feedback: fb.status, edit1: s1, edit2: s2, stale }
})

// 6. Selection layer: highlight a paragraph, look for the Comment button
await page.locator('#bracelet').scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
const para = page.locator('#bracelet p').first()
await para.selectText()
await page.waitForTimeout(600)
const selButtons = await page.locator('.dfb-selection-btn').allTextContents()
await page.locator('#bracelet').screenshot({ path: join(OUT, 'verify-devmode.png') })

// 7. Mobile pass
await page.setViewportSize({ width: 390, height: 844 })
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 500) {
    window.scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 40))
  }
})
const hOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2)
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(400)
await page.screenshot({ path: join(OUT, 'verify-mobile.png'), fullPage: false })

console.log(JSON.stringify({ missing, cardCount, litCount, devProbe, selButtons, hOverflow, errors: errors.slice(0, 5) }, null, 2))
await browser.close()
