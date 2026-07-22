/**
 * End-to-end verification of the tabbed essay + dev mode against a running
 * `vite dev` server. Screenshots go to tools/raw-captures/verify-*.png.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.BASE || 'http://localhost:5199'
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'raw-captures')
mkdirSync(OUT, { recursive: true })

const TABS = ['story', 'work', 'engine', 'road', 'together']

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

const scrollThrough = async () => {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 55))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(600)
}

// 1. Every tab: render, scan for missing nodes, check nav active state
const missing = {}
const navActive = {}
for (const tab of TABS) {
  await page.goto(`${BASE}/#/${tab}`, { waitUntil: 'networkidle' })
  await scrollThrough()
  missing[tab] = await page.evaluate(() => document.body.innerText.match(/⟨missing:[^⟩]*⟩/g) || [])
  navActive[tab] = await page.locator('.nav-link.active').innerText()
  await page.screenshot({ path: join(OUT, `verify-tab-${tab}.png`), fullPage: false })
}

// 2. Work tab: search demo, soundscape demo, lightbox
await page.goto(`${BASE}/#/work`, { waitUntil: 'networkidle' })
await scrollThrough()
await page.locator('.sd-btn').click()
await page.waitForSelector('.sd-card', { timeout: 5000 })
const cardCount = await page.locator('.sd-card').count()
await page.locator('#journey1').screenshot({ path: join(OUT, 'verify-journey1.png') })

const parono = page.locator('.ss-hit', { hasText: 'similar-sounding' }).first()
await parono.scrollIntoViewIfNeeded()
await parono.click()
await page.waitForTimeout(400)
const litCount = await page.locator('.ss-tok.hl').count()
await page.locator('#journey3 .demo').screenshot({ path: join(OUT, 'verify-soundscape.png') })

await page.locator('#journey1 .shot-frame').first().click()
await page.waitForSelector('.lightbox img', { timeout: 3000 })
const lightboxShown = await page.locator('.lightbox img').isVisible()
await page.keyboard.press('Escape')
await page.waitForTimeout(250)
const lightboxClosed = (await page.locator('.lightbox').count()) === 0

// 3. Engine tab: stats + pipeline animate in
await page.goto(`${BASE}/#/engine`, { waitUntil: 'networkidle' })
await page.locator('#engine .stats').scrollIntoViewIfNeeded()
await page.waitForTimeout(1800)
const pipelineOn = await page.evaluate(() => {
  document.querySelector('.pipeline')?.scrollIntoView({ block: 'center' })
  return new Promise((r) => setTimeout(() => r(document.querySelector('.pipeline')?.classList.contains('on')), 900))
})
await page.locator('#engine').screenshot({ path: join(OUT, 'verify-engine.png') })

// 4. Dev endpoints: feedback inbox + content edit round-trip + stale guard
const devProbe = await page.evaluate(async () => {
  const fb = await fetch('/__feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'verify-probe.md', markdown: '# probe\nverification round-trip' }),
  })
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

// 5. Selection layer on the story tab: highlight a paragraph, expect buttons
await page.goto(`${BASE}/#/story`, { waitUntil: 'networkidle' })
await page.locator('#bracelet').scrollIntoViewIfNeeded()
await page.waitForTimeout(500)
const para = page.locator('#bracelet p').first()
const box = await para.boundingBox()
await page.mouse.move(box.x + 5, box.y + 8)
await page.mouse.down()
await page.mouse.move(box.x + Math.min(260, box.width - 10), box.y + 8, { steps: 8 })
await page.mouse.up()
await page.waitForTimeout(600)
const selButtons = await page.locator('.dfb-selection-btn').allTextContents()

// 6. Mobile pass across all tabs: no horizontal overflow
await page.setViewportSize({ width: 390, height: 844 })
const hOverflow = {}
for (const tab of TABS) {
  await page.goto(`${BASE}/#/${tab}`, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 35))
    }
  })
  hOverflow[tab] = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  )
}
await page.goto(`${BASE}/#/story`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.screenshot({ path: join(OUT, 'verify-mobile.png') })

console.log(
  JSON.stringify(
    { missing, navActive, cardCount, litCount, lightboxShown, lightboxClosed, pipelineOn, devProbe, selButtons, hOverflow, errors: errors.slice(0, 6) },
    null,
    2,
  ),
)
await browser.close()
