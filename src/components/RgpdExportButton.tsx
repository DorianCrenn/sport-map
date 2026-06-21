import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

interface RgpdExportButtonProps {
  userId: string;
  userEmail: string;
}

export default function RgpdExportButton({ userId, userEmail }: RgpdExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      // Collecter toutes les données de l'utilisateur
      const [
        { data: profile },
        { data: events },
        { data: favorites },
        { data: attendees },
        { data: follows },
        { data: comments },
        { data: rides },
        { data: feedback },
        { data: analytics },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('events').select('id, title, sport, date, city, created_at').eq('user_id', userId),
        supabase.from('favorites').select('event_id, created_at').eq('user_id', userId),
        supabase.from('attendees').select('event_id, created_at').eq('user_id', userId),
        supabase.from('club_follows').select('club_id, teams, created_at').eq('user_id', userId),
        supabase.from('event_comments').select('event_id, content, created_at').eq('user_id', userId),
        supabase.from('rides').select('event_id, departure, seats, status, created_at').eq('driver_id', userId),
        supabase.from('app_feedback').select('type, status, title, created_at').eq('user_id', userId),
        supabase.from('analytics_events').select('event_type, created_at').eq('user_id', userId).limit(200),
      ]);

      const exportData = {
        exportDate:    new Date().toISOString(),
        exportVersion: '1.0',
        user: {
          id:     userId,
          email:  userEmail,
          name:   (profile as any)?.name,
          createdAt: (profile as any)?.created_at,
          favoriteSports: (profile as any)?.favorite_sports,
          xp:     (profile as any)?.xp,
          badges: (profile as any)?.badges,
        },
        events:    events ?? [],
        favorites: favorites ?? [],
        attendees: attendees ?? [],
        clubFollows: follows ?? [],
        comments:  comments ?? [],
        rides:     rides ?? [],
        feedback:  feedback ?? [],
        analyticsEvents: (analytics ?? []).map((e: any) => ({ type: e.event_type, date: e.created_at })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `sportlink-mes-donnees-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (err) {
      console.error('[RgpdExport]', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '14px', borderRadius: 16, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', margin: '0 0 4px' }}>Mes données personnelles</p>
      <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: '0 0 12px', lineHeight: 1.5 }}>
        Conformément au RGPD (art. 20), téléchargez une copie de toutes vos données SportLink.
      </p>
      <button
        onClick={handleExport}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 14px', borderRadius: 10,
          border: '1px solid var(--sl-border)',
          background: done ? 'rgba(34,197,94,0.1)' : 'var(--sl-surface)',
          color: done ? '#16a34a' : 'var(--sl-t1)',
          fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {loading ? (
          <><span style={{ fontSize: 14 }}>⏳</span> Préparation…</>
        ) : done ? (
          <><span style={{ fontSize: 14 }}>✅</span> Téléchargé !</>
        ) : (
          <><span style={{ fontSize: 14 }}>⬇️</span> Télécharger mes données (.json)</>
        )}
      </button>
    </div>
  );
}
