/**
 * Verify the DEPLOYED site, not the workflow badge.
 *
 * A green Pages run only proves an artifact was uploaded. It says nothing about
 * whether the base path is right, whether the images resolve, or whether the
 * dev-feedback tools leaked into the bundle. Those are the three ways this
 * particular deploy could look fine and be broken, so they are what this checks.
 *
 * Run: node tools/verify-live.mjs [url]
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const URL_BASE = process.argv[2] || 'https://joshuafrost712.github.io/origo-pitch-visual-essay/'
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'raw-captures', 'presentation')
mkdirSync(OUT, { recursive: true })

const TABS = ['story', 'work', 'engine', 'quality', 'road', 'together']

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })

const errors = []
const badResponses = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('requestfailed', (r) => badResponses.push(`FAILED ${r.url()}`))
page.on('response', (r) => {
  if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`)
})

const sweep = () =>
  page.evaluate(async () => {
    const root = document.documentElement
    root.style.scrollBehavior = 'auto'
    for (let y = 0; y < document.body.scrollHeight; y += 420) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 110))
    }
    window.scrollTo(0, 0)
  })

const report = { url: URL_BASE, tabs: {} }

for (const tab of TABS) {
  await page.goto(URL_BASE + '#/' + tab, { waitUntil: 'networkidle', timeout: 60000 })
  await sweep()
  await page.waitForTimeout(700)
  report.tabs[tab] = await page.evaluate(() => {
    const imgs = Array.prototype.slice.call(document.images)
    const missing = document.body.innerText.match(/⟨missing:[^⟩]*⟩/g)
    return {
      activeNav: document.querySelector('.nav-link.active')?.textContent?.trim(),
      navCount: document.querySelectorAll('.nav-link').length,
      missingNodes: missing ? missing.length : 0,
      images: imgs.length,
      brokenImages: imgs.filter((i) => !i.complete || i.naturalWidth === 0).length,
      devWidgetPresent: !!document.querySelector('[class*="dfb-"]'),
      scenesTriggered: document.querySelectorAll('.vs-lanes.on').length,
      horizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    }
  })
  await page.screenshot({ path: join(OUT, `LIVE-${tab}.png`) })
}

await page.goto(URL_BASE + '#/quality', { waitUntil: 'networkidle' })
await sweep()
report.qualityMap = await page.evaluate(() => ({
  stages: document.querySelectorAll('.qm-stage').length,
  components: document.querySelectorAll('.qm-comp').length,
  gaps: document.querySelectorAll('.qm-comp--gap').length,
  trustSteps: document.querySelectorAll('.td-node').length,
}))

await page.goto(URL_BASE + '#/engine', { waitUntil: 'networkidle' })
await page.locator('#engine .stats').scrollIntoViewIfNeeded()
await page.waitForTimeout(2200)
report.stats = await page.evaluate(() =>
  Array.prototype.slice.call(document.querySelectorAll('.stat .num')).map((n) => n.textContent),
)

report.badResponses = badResponses
report.errors = errors
console.log(JSON.stringify(report, null, 2))
await browser.close()
