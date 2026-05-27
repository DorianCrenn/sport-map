/**
 * Generates public/sitemap.xml at build time.
 * Queries Supabase for all public club pages.
 * Called by: npm run build (via package.json "prebuild" hook).
 *
 * Env vars required (from .env.local / Vercel env):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *   VITE_BASE_URL  (optional, defaults to https://sportlink.vercel.app)
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON    = process.env.VITE_SUPABASE_ANON_KEY;
const BASE_URL         = (process.env.VITE_BASE_URL || 'https://sportlink.vercel.app').replace(/\/$/, '');

async function fetchClubs() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.warn('[sitemap] Missing Supabase env vars — sitemap will only contain homepage');
    return [];
  }
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clubs?select=id,updated_at&order=created_at.asc&limit=2000`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } },
    );
    if (!res.ok) {
      console.warn('[sitemap] Supabase responded', res.status, '— skipping clubs');
      return [];
    }
    return await res.json();
  } catch (e) {
    console.warn('[sitemap] Network error fetching clubs:', e.message);
    return [];
  }
}

function fmt(iso) {
  return iso ? String(iso).slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function main() {
  const clubs = await fetchClubs();
  const today = new Date().toISOString().slice(0, 10);

  const entries = [
    urlEntry(`${BASE_URL}/`, today, 'daily', '1.0'),
    ...clubs.map(c =>
      urlEntry(`${BASE_URL}/clubs/${c.id}`, fmt(c.updated_at), 'weekly', '0.8')
    ),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].join('\n');

  const outPath = join(__dirname, '..', 'public', 'sitemap.xml');
  writeFileSync(outPath, xml, 'utf8');
  console.log(`[sitemap] ✓ ${entries.length} URL(s) → public/sitemap.xml`);
}

main().catch(err => {
  // Never fail the Vercel build — sitemap is nice-to-have
  console.error('[sitemap] Generation failed (non-fatal):', err.message);
  process.exit(0);
});
