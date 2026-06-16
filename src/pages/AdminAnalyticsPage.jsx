import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useAdminAnalytics } from '../hooks/useAdminAnalytics.js';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend, Filler,
);

// ── Constantes visuelles ──────────────────────────────────────────────────────

const CHART_COLORS = {
  indigo:    { solid: '#6366f1', dim: 'rgba(99,102,241,0.15)' },
  green:     { solid: '#10b981', dim: 'rgba(16,185,129,0.15)' },
  amber:     { solid: '#f59e0b', dim: 'rgba(245,158,11,0.15)' },
  blue:      { solid: '#3b82f6', dim: 'rgba(59,130,246,0.15)' },
  purple:    { solid: '#8b5cf6', dim: 'rgba(139,92,246,0.15)' },
};

const CHANNEL_LABELS = {
  download:     'Téléchargement',
  whatsapp:     'WhatsApp',
  instagram:    'Instagram',
  facebook:     'Facebook',
  download_all: 'Multi-format',
};

const FORMAT_LABELS = {
  story:     'Story 9:16',
  square:    'Post 1:1',
  landscape: 'Landscape 16:9',
};

const FEATURE_LABELS = {
  page_view:         'Pages vues',
  event_created:     'Événements créés',
  poster_opened:     'PosterStudio ouvert',
  club_created:      'Clubs créés',
  ride_created:      'Covoiturages',
  user_login:        'Connexions',
  convocation_sent:  'Convocations',
  announcement_sent: 'Annonces',
};

const PERIOD_OPTIONS = [
  { value: 7,  label: '7 jours' },
  { value: 30, label: '30 jours' },
  { value: 90, label: '90 jours' },
];

// ── Composants internes ───────────────────────────────────────────────────────

function TrendBadge({ pct }) {
  if (pct === null || pct === undefined) return null;
  const up    = pct >= 0;
  const color = up ? '#10b981' : '#ef4444';
  const arrow = up ? '↑' : '↓';
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color,
      backgroundColor: `${color}15`,
      padding: '2px 6px', borderRadius: 10,
    }}>
      {arrow} {Math.abs(pct)}%
    </span>
  );
}

function KpiCard({ label, value, sub, color = '#6366f1', icon, trend }) {
  return (
    <div style={{
      backgroundColor: 'var(--sl-card)', borderRadius: 16,
      padding: 16, border: '1px solid var(--sl-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          backgroundColor: `${color}20`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </div>
        <TrendBadge pct={trend} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--sl-t1)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 11, color: 'var(--sl-t3)', fontWeight: 500, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{
      backgroundColor: 'var(--sl-card)', borderRadius: 16, padding: 16,
      border: '1px solid var(--sl-border)',
    }}>
      <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{title}</p>
      {children}
    </div>
  );
}

function EmptyChart({ message = 'Données en cours de collecte…' }) {
  return (
    <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
      <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: 0 }}>{message}</p>
    </div>
  );
}

const CHART_OPTS_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e2533',
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 7 },
    },
    y: {
      grid: { color: 'rgba(100,116,139,0.12)' },
      ticks: { color: '#64748b', font: { size: 10 } },
      beginAtZero: true,
    },
  },
};

function shortDay(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AdminAnalyticsPage({ onBack }) {
  const [period, setPeriod] = useState(7);
  const { data, loading, fetchDashboard } = useAdminAnalytics();

  useEffect(() => {
    fetchDashboard(period);
  }, [period, fetchDashboard]);

  const labels = data?.dayList?.map(shortDay) ?? [];

  function lineDs(curve, color) {
    return {
      labels,
      datasets: [{
        data: curve?.map(r => r.count) ?? [],
        borderColor: color.solid,
        backgroundColor: color.dim,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: color.solid,
      }],
    };
  }

  function barDs(curve, color) {
    return {
      labels,
      datasets: [{
        data: curve?.map(r => r.count) ?? [],
        backgroundColor: color.dim,
        borderColor: color.solid,
        borderWidth: 1.5,
        borderRadius: 5,
      }],
    };
  }

  // Doughnut exports par canal
  const channelKeys   = Object.keys(data?.exportByChannel ?? {});
  const channelColors = ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6'];
  const channelDs = channelKeys.length > 0 ? {
    labels: channelKeys.map(k => CHANNEL_LABELS[k] ?? k),
    datasets: [{
      data: channelKeys.map(k => data.exportByChannel[k]),
      backgroundColor: channelColors,
      borderWidth: 0,
    }],
  } : null;

  // Bar feature usage
  const featureKeys = Object.keys(data?.featureCount ?? {}).sort((a, b) => (data.featureCount[b] - data.featureCount[a]));
  const featureDs = featureKeys.length > 0 ? {
    labels: featureKeys.map(k => FEATURE_LABELS[k] ?? k),
    datasets: [{
      data: featureKeys.map(k => data.featureCount[k]),
      backgroundColor: CHART_COLORS.indigo.dim,
      borderColor: CHART_COLORS.indigo.solid,
      borderWidth: 1.5,
      borderRadius: 5,
    }],
  } : null;

  const CHART_HEIGHT = 150;
  const DOUGHNUT_HEIGHT = 180;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      display: 'flex', flexDirection: 'column',
      backgroundColor: 'var(--sl-bg)', fontFamily: 'Inter, sans-serif',
    }}>
      {/* ── Header ── */}
      <div style={{
        flexShrink: 0, backgroundColor: 'var(--sl-card)',
        borderBottom: '1px solid var(--sl-border)', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button
          onClick={onBack}
          aria-label="Retour à l'administration"
          style={{
            width: 38, height: 38, borderRadius: 10, border: 'none',
            backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em' }}>Analytics</h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--sl-t3)' }}>Vue d'ensemble SportLink</p>
        </div>

        {/* Sélecteur de période */}
        <div style={{ display: 'flex', gap: 4 }}>
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              style={{
                padding: '5px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                backgroundColor: period === value ? '#6366f1' : 'var(--sl-surface)',
                color: period === value ? '#fff' : 'var(--sl-t3)',
                transition: 'all 0.12s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14, overscrollBehavior: 'contain' }}>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--sl-border)', borderTopColor: '#6366f1', animation: 'sl-spin 0.7s linear infinite' }} />
          </div>
        )}

        {!loading && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── KPIs globaux ── */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Cumul total
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <KpiCard
                  label="Utilisateurs"
                  value={data.kpi.totalUsers}
                  color="#6366f1"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
                />
                <KpiCard
                  label="Clubs"
                  value={data.kpi.totalClubs}
                  color="#10b981"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>}
                />
              </div>
            </div>

            {/* ── KPIs période ── */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Sur les {period} derniers jours
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <KpiCard
                  label="Nouveaux utilisateurs"
                  value={data.kpi.newUsers}
                  trend={data.trends?.newUsers}
                  color="#6366f1"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>}
                />
                <KpiCard
                  label="Nouveaux clubs"
                  value={data.kpi.newClubs}
                  trend={data.trends?.newClubs}
                  color="#10b981"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                />
                <KpiCard
                  label="Événements créés"
                  value={data.kpi.newEvents}
                  trend={data.trends?.newEvents}
                  color="#f59e0b"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                />
                <KpiCard
                  label="Affiches exportées"
                  value={data.kpi.newPosters}
                  trend={data.trends?.newPosters}
                  color="#8b5cf6"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
                />
                <KpiCard
                  label="Clubs actifs"
                  value={data.kpi.activeClubs}
                  sub="avec événement récent"
                  color="#f97316"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                />
                <KpiCard
                  label="Utilisateurs actifs"
                  value={data.kpi.activeUsers}
                  sub={data.hasAnalyticsData ? undefined : 'Données en cours…'}
                  color="#3b82f6"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                />
              </div>
            </div>

            {/* ── Courbe inscriptions ── */}
            <ChartCard title={`Nouveaux utilisateurs (${period}j)`}>
              {(data.curves.usersByDay?.every(r => r.count === 0)) ? (
                <EmptyChart message="Aucun nouvel utilisateur sur la période" />
              ) : (
                <div style={{ height: CHART_HEIGHT }}>
                  <Line data={lineDs(data.curves.usersByDay, CHART_COLORS.indigo)} options={CHART_OPTS_BASE} />
                </div>
              )}
            </ChartCard>

            {/* ── Courbe nouveaux clubs ── */}
            <ChartCard title={`Nouveaux clubs (${period}j)`}>
              {(data.curves.clubsByDay?.every(r => r.count === 0)) ? (
                <EmptyChart message="Aucun nouveau club sur la période" />
              ) : (
                <div style={{ height: CHART_HEIGHT }}>
                  <Line data={lineDs(data.curves.clubsByDay, CHART_COLORS.green)} options={CHART_OPTS_BASE} />
                </div>
              )}
            </ChartCard>

            {/* ── Bar événements ── */}
            <ChartCard title={`Événements créés (${period}j)`}>
              {(data.curves.eventsByDay?.every(r => r.count === 0)) ? (
                <EmptyChart message="Aucun événement sur la période" />
              ) : (
                <div style={{ height: CHART_HEIGHT }}>
                  <Bar data={barDs(data.curves.eventsByDay, CHART_COLORS.amber)} options={CHART_OPTS_BASE} />
                </div>
              )}
            </ChartCard>

            {/* ── Bar exports affiches ── */}
            <ChartCard title={`Exports affiches (${period}j)`}>
              {(data.curves.postersByDay?.every(r => r.count === 0)) ? (
                <EmptyChart message="Aucun export sur la période" />
              ) : (
                <div style={{ height: CHART_HEIGHT }}>
                  <Bar data={barDs(data.curves.postersByDay, CHART_COLORS.purple)} options={CHART_OPTS_BASE} />
                </div>
              )}
            </ChartCard>

            {/* ── Doughnut canal d'export ── */}
            {channelDs ? (
              <ChartCard title="Répartition exports par canal">
                <div style={{ height: DOUGHNUT_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: DOUGHNUT_HEIGHT, height: DOUGHNUT_HEIGHT }}>
                    <Doughnut
                      data={channelDs}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom',
                            labels: { color: '#94a3b8', font: { size: 10 }, padding: 8, boxWidth: 10 },
                          },
                          tooltip: { backgroundColor: '#1e2533', titleColor: '#e2e8f0', bodyColor: '#94a3b8', cornerRadius: 8 },
                        },
                        cutout: '65%',
                      }}
                    />
                  </div>
                </div>
              </ChartCard>
            ) : (
              <ChartCard title="Répartition exports par canal">
                <EmptyChart message="Aucun export pour l'instant" />
              </ChartCard>
            )}

            {/* ── Formats affiches ── */}
            {Object.keys(data.exportByFormat).length > 0 && (
              <ChartCard title="Formats d'affiche utilisés">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(data.exportByFormat)
                    .sort(([, a], [, b]) => b - a)
                    .map(([format, count]) => {
                      const total = Object.values(data.exportByFormat).reduce((s, n) => s + n, 0);
                      const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={format}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: 'var(--sl-t2)', fontWeight: 600 }}>
                              {FORMAT_LABELS[format] ?? format}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{count} ({pct}%)</span>
                          </div>
                          <div style={{ height: 6, backgroundColor: 'var(--sl-surface)', borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#8b5cf6', borderRadius: 6, transition: 'width 0.4s' }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </ChartCard>
            )}

            {/* ── Feature usage (analytics_events) ── */}
            <ChartCard title={`Fonctionnalités utilisées (${period}j)`}>
              {featureDs ? (
                <div style={{ height: CHART_HEIGHT }}>
                  <Bar
                    data={featureDs}
                    options={{
                      ...CHART_OPTS_BASE,
                      indexAxis: 'y',
                      scales: {
                        x: { ...CHART_OPTS_BASE.scales.x, grid: { color: 'rgba(100,116,139,0.12)' } },
                        y: { ...CHART_OPTS_BASE.scales.y, grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                      },
                    }}
                  />
                </div>
              ) : (
                <EmptyChart message="Collecte en cours — les données apparaîtront une fois le consentement recueilli" />
              )}
            </ChartCard>

            {/* ── Top templates ── */}
            {data.topTemplates && data.topTemplates.length > 0 && (
              <ChartCard title="Templates les plus utilisés (tous temps)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.topTemplates.map((tpl, i) => {
                    const maxCount = data.topTemplates[0].count;
                    const pct      = maxCount > 0 ? Math.round((tpl.count / maxCount) * 100) : 0;
                    const rankColors = ['#f59e0b','#94a3b8','#cd7f32'];
                    return (
                      <div key={tpl.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: rankColors[i] ?? 'var(--sl-t3)', minWidth: 18, textAlign: 'center' }}>
                            {i < 3 ? ['🥇','🥈','🥉'][i] : `${i + 1}.`}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--sl-t2)', fontWeight: 600, flex: 1, fontFamily: 'monospace' }}>{tpl.id}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', fontVariantNumeric: 'tabular-nums' }}>{tpl.count}×</span>
                        </div>
                        <div style={{ height: 4, backgroundColor: 'var(--sl-surface)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: CHART_COLORS.amber.solid, borderRadius: 4, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            )}

            {/* ── Funnel de conversion ── */}
            {data.funnel && (
              <ChartCard title="Funnel de conversion (cumul total)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.funnel.map((step, i) => {
                    const top   = data.funnel[0].count;
                    const pct   = top > 0 ? Math.round((step.count / top) * 100) : 0;
                    const prev  = i > 0 ? data.funnel[i - 1].count : top;
                    const drop  = i > 0 && prev > 0 ? Math.round(((prev - step.count) / prev) * 100) : null;
                    const colors = ['#6366f1','#818cf8','#a5b4fc','#c7d2fe','#e0e7ff'];
                    return (
                      <div key={step.label}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 14 }}>{step.icon}</span>
                          <span style={{ fontSize: 12, color: 'var(--sl-t2)', fontWeight: 600, flex: 1 }}>{step.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)', fontVariantNumeric: 'tabular-nums' }}>
                            {step.count.toLocaleString('fr-FR')}
                          </span>
                          <span style={{ fontSize: 11, color: colors[i] ?? '#6366f1', fontWeight: 700, minWidth: 36, textAlign: 'right' }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{ height: 6, backgroundColor: 'var(--sl-surface)', borderRadius: 6, overflow: 'hidden', marginBottom: drop !== null ? 2 : 8 }}>
                          <div style={{
                            width: `${pct}%`, height: '100%',
                            backgroundColor: colors[i] ?? '#6366f1',
                            borderRadius: 6, transition: 'width 0.5s ease',
                          }} />
                        </div>
                        {drop !== null && drop > 0 && (
                          <p style={{ margin: '0 0 8px 22px', fontSize: 10, color: '#ef4444', fontWeight: 500 }}>
                            ↓ {drop}% de perte à cette étape
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            )}

            <div style={{ height: 16 }} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
