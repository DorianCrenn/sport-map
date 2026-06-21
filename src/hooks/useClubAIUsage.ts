import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

interface AIUsage { import_count: number; generate_count: number; }

const DEFAULT: AIUsage = { import_count: 0, generate_count: 0 };

export function useClubAIUsage(clubId: string | null | undefined): {
  usage: AIUsage;
  optimisticIncrement: (field: keyof AIUsage) => void;
} {
  const [usage, setUsage] = useState<AIUsage>(DEFAULT);

  useEffect(() => {
    if (!clubId) return;
    const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    supabase
      .from('club_ai_usage')
      .select('import_count, generate_count')
      .eq('club_id', String(clubId))
      .eq('month', month)
      .maybeSingle()
      .then(({ data }: { data: AIUsage | null }) => { if (data) setUsage(data); });
  }, [clubId]);

  function optimisticIncrement(field: keyof AIUsage) {
    setUsage(u => ({ ...u, [field]: (u[field] ?? 0) + 1 }));
  }

  return { usage, optimisticIncrement };
}
