/**
 * QA Scan automatique — SportLink
 * Détecte les nouvelles pages, composants, hooks sans couverture de tests.
 * Génère e2e/reports/qa-scan.json avec les gaps identifiés.
 *
 * Usage : node scripts/qa-scan.js
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

async function listFiles(dir, ext = ['.jsx', '.js', '.ts', '.tsx']) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await listFiles(fullPath, ext));
      } else if (ext.some((e) => entry.name.endsWith(e))) {
        files.push(fullPath);
      }
    }
    return files;
  } catch {
    return [];
  }
}

async function getTestFiles() {
  const unitTests = await listFiles(path.join(ROOT, 'src', '__tests__'));
  const e2eTests = await listFiles(path.join(ROOT, 'e2e'));
  return {
    unit: unitTests.map((f) => path.basename(f).replace(/\.test\.(jsx?|tsx?)$/, '').replace(/\.spec\.(jsx?|tsx?)$/, '')),
    e2e: e2eTests.map((f) => path.basename(f).replace(/\.spec\.(jsx?|tsx?)$/, '')),
  };
}

async function scanPages() {
  const pagesDir = path.join(ROOT, 'src', 'pages');
  const files = await listFiles(pagesDir);
  return files.map((f) => ({
    file: path.basename(f),
    name: path.basename(f).replace(/\.(jsx?|tsx?)$/, ''),
    path: f.replace(ROOT, '').replace(/\\/g, '/'),
  }));
}

async function scanComponents() {
  const componentsDir = path.join(ROOT, 'src', 'components');
  const files = await listFiles(componentsDir);
  return files
    .filter((f) => !f.includes('templates') && !f.includes('test'))
    .map((f) => ({
      file: path.basename(f),
      name: path.basename(f).replace(/\.(jsx?|tsx?)$/, ''),
      path: f.replace(ROOT, '').replace(/\\/g, '/'),
    }));
}

async function scanHooks() {
  const hooksDir = path.join(ROOT, 'src', 'hooks');
  const files = await listFiles(hooksDir);
  return files.map((f) => ({
    file: path.basename(f),
    name: path.basename(f).replace(/\.(jsx?|tsx?)$/, ''),
    path: f.replace(ROOT, '').replace(/\\/g, '/'),
  }));
}

async function main() {
  console.log('🔍 SportLink QA Scan — Analyse de la couverture...\n');

  const [pages, components, hooks, tests] = await Promise.all([
    scanPages(),
    scanComponents(),
    scanHooks(),
    getTestFiles(),
  ]);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {},
    gaps: {
      pages: [],
      criticalComponents: [],
      hooks: [],
    },
    covered: {
      unit: tests.unit,
      e2e: tests.e2e,
    },
  };

  // Analyser les pages sans tests
  const pageGaps = pages.filter((p) => {
    const baseName = p.name;
    return !tests.unit.some((t) => t.includes(baseName)) &&
           !tests.e2e.some((t) => t.includes(baseName.toLowerCase().replace('page', '')));
  });

  // Analyser les composants critiques sans tests
  const criticalComponentPatterns = [
    'ClubPageView', 'PosterStudio', 'PosterEditor', 'PosterRenderer',
    'ClubDashboard', 'EventComments', 'EventReactions', 'ConvocationsList',
    'RideSection', 'ClubFormModal', 'Header', 'AnnouncementsCenter',
  ];
  const componentGaps = components.filter((c) =>
    criticalComponentPatterns.some((p) => c.name.includes(p)) &&
    !tests.unit.some((t) => t.includes(c.name))
  );

  // Analyser les hooks sans tests
  const hookGaps = hooks.filter((h) =>
    !tests.unit.some((t) => t.includes(h.name))
  );

  report.gaps.pages = pageGaps.map((p) => ({
    name: p.name,
    path: p.path,
    recommendedTest: `src/__tests__/${p.name}.test.jsx`,
    e2eFile: `e2e/pages/${p.name.toLowerCase().replace('page', '')}.spec.js`,
  }));

  report.gaps.criticalComponents = componentGaps.map((c) => ({
    name: c.name,
    path: c.path,
    recommendedTest: `src/__tests__/${c.name}.test.jsx`,
  }));

  report.gaps.hooks = hookGaps.map((h) => ({
    name: h.name,
    path: h.path,
    recommendedTest: `src/__tests__/${h.name}.test.js`,
  }));

  report.summary = {
    pages: { total: pages.length, gaps: pageGaps.length, covered: pages.length - pageGaps.length },
    components: { total: components.length, criticalGaps: componentGaps.length },
    hooks: { total: hooks.length, gaps: hookGaps.length, covered: hooks.length - hookGaps.length },
    unitTests: tests.unit.length,
    e2eTests: tests.e2e.length,
  };

  // Affichage console
  console.log('📊 RÉSUMÉ');
  console.log('─────────────────────────────────');
  console.log(`Pages     : ${report.summary.pages.covered}/${report.summary.pages.total} couvertes (${pageGaps.length} gaps)`);
  console.log(`Composants: ${componentGaps.length} composants critiques sans tests`);
  console.log(`Hooks     : ${report.summary.hooks.covered}/${report.summary.hooks.total} couverts (${hookGaps.length} gaps)`);
  console.log(`Tests unit: ${tests.unit.length} fichiers`);
  console.log(`Tests E2E : ${tests.e2e.length} fichiers`);

  if (report.gaps.pages.length > 0) {
    console.log('\n⚠️  PAGES SANS TESTS E2E :');
    report.gaps.pages.forEach((p) => console.log(`  - ${p.name} → ${p.e2eFile}`));
  }

  if (report.gaps.criticalComponents.length > 0) {
    console.log('\n⚠️  COMPOSANTS CRITIQUES SANS TESTS :');
    report.gaps.criticalComponents.forEach((c) => console.log(`  - ${c.name} → ${c.recommendedTest}`));
  }

  if (report.gaps.hooks.length > 0) {
    console.log('\n⚠️  HOOKS SANS TESTS (top 10) :');
    report.gaps.hooks.slice(0, 10).forEach((h) => console.log(`  - ${h.name} → ${h.recommendedTest}`));
    if (report.gaps.hooks.length > 10) console.log(`  ... et ${report.gaps.hooks.length - 10} autres`);
  }

  // Sauvegarder le rapport JSON
  const reportsDir = path.join(ROOT, 'e2e', 'reports');
  if (!existsSync(reportsDir)) {
    await mkdir(reportsDir, { recursive: true });
  }
  const reportPath = path.join(reportsDir, 'qa-scan.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Rapport sauvegardé : e2e/reports/qa-scan.json`);

  // Exit code non-zéro si gaps critiques
  const hasCriticalGaps = componentGaps.length > 0 || pageGaps.length > 2;
  if (hasCriticalGaps) {
    console.log('\n⚠️  Des gaps de couverture ont été détectés. Consultez QA_REGISTRY.md.');
    process.exit(1);
  } else {
    console.log('\n✅ Couverture QA satisfaisante.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Erreur QA Scan :', err);
  process.exit(1);
});
