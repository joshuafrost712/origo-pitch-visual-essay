/** Captures the "Find a work" section of the local Corpus Catalogue (http://127.0.0.1:8077/catalogue) into tools/raw-captures/. The totals strip is left out on purpose: its figures differ from the essay's published stats. Review by hand before copying to src/assets/shots/. */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'raw-captures')
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 })
await page.goto('http://127.0.0.1:8077/catalogue', { waitUntil: 'networkidle' })
await page.fill('input[type=text]', 'Gilgamesh')
await page.waitForTimeout(1500)
const section = page.locator('section', { has: page.locator('input[type=text]') }).first()
await section.screenshot({ path: join(OUT, 'catalogue-find.png') })
await browser.close()
console.log('ok')
