import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const DEFAULT = { import_count: 0, generate_count: 0, monthly_limit: 5 };

export function useClubAIUsage(clubId) {
  const [usage, setUsage] = useState(DEFAULT);

  useEffect(() => {
    if (!clubId) return;
    const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().slice(0, 10);
    supabase
      .from('club_ai_usage')
      .select('import_count, generate_count, monthly_limit')
      .eq('club_id', String(clubId))
      .eq('month', month)
      .maybeSingle()
      .then(({ data }) => { if (data) setUsage(data); });
  }, [clubId]);

  function optimisticIncrement(field) {
    setUsage(u => ({ ...u, [field]: (u[field] ?? 0) + 1 }));
  }

  return { usage, optimisticIncrement };
}
