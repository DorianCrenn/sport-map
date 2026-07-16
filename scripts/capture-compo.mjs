import { chromium } from 'playwright';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../.compo');
import { mkdirSync } from 'fs';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 }, deviceScaleFactor: 2, locale: 'fr-FR',
  serviceWorkers: 'block',
});
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('PAGE ERR:', m.text()); });

await page.addInitScript(() => localStorage.setItem('sl-theme', 'light'));
await page.goto('http://localhost:5173/?devmodals=CompoPoster', { waitUntil: 'networkidle', timeout: 40000 });
await page.waitForTimeout(1500);

// Le harnais auto-ouvre la modale via `initial`. Si pas ouverte, on clique.
if (!(await page.locator('[role="dialog"]').count())) {
  const btn = page.locator('[data-modal="CompoPoster"]');
  if (await btn.count()) { await btn.click(); }
}
await page.waitForTimeout(2500);

const formats = [
  { label: 'Publication', file: 'post' },
  { label: 'Story', file: 'story' },
  { label: 'Carré', file: 'square' },
];

for (const f of formats) {
  // clique le bouton de format dans la barre haute
  const seg = page.locator('button', { hasText: f.label }).first();
  if (await seg.count()) { await seg.click().catch(() => {}); }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: resolve(OUT, `compo-${f.file}.png`) });
  console.log('captured', f.file);
}

await browser.close();
console.log('done ->', OUT);
