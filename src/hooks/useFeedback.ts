import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { sanitizeText } from '../lib/sanitize.js';
import { useAuth } from '../contexts/AuthContext.js';
import type { AppFeedback } from '../types/sportlink.js';

interface SubmitOptions {
  type: 'bug' | 'idea' | 'question';
  title: string;
  description?: string;
  category?: string;
  pageUrl?: string;
  browserInfo?: Record<string, unknown>;
  appVersion?: string;
}

interface UseFeedbackResult {
  ideas: AppFeedback[];
  submit: (opts: SubmitOptions) => Promise<void>;
  fetchIdeas: () => Promise<AppFeedback[]>;
  vote: (feedbackId: string) => Promise<void>;
  unvote: (feedbackId: string) => Promise<void>;
  searchSimilar: (query: string, list: AppFeedback[]) => AppFeedback[];
  loadMyVotes: () => Promise<Set<string>>;
}

export function useFeedback(): UseFeedbackResult {
  const { currentUser } = useAuth();
  const [ideas, setIdeas]           = useState<AppFeedback[]>([]);
  const [ideasLoaded, setIdeasLoaded] = useState(false);

  const submit = useCallback(async ({ type, title, description, category, pageUrl, browserInfo, appVersion }: SubmitOptions) => {
    if (!currentUser) throw new Error('Non connecté');
    const { error } = await supabase.from('app_feedback').insert({
      user_id:      currentUser.id,
      club_id:      currentUser.clubId ?? null,
      type,
      category:     category || null,
      title:        sanitizeText(title.trim()),
      description:  description ? sanitizeText(description.trim()) : null,
      page_url:     pageUrl || null,
      browser_info: browserInfo || {},
      app_version:  appVersion || null,
    }) as { error: { message: string } | null };
    if (error) throw new Error(error.message);
  }, [currentUser]);

  const fetchIdeas = useCallback(async (): Promise<AppFeedback[]> => {
    if (ideasLoaded) return ideas;
    const { data } = await supabase
      .from('app_feedback')
      .select('id, title, description, status, vote_count, created_at')
      .eq('type', 'idea')
      .is('merged_into', null)
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50) as { data: AppFeedback[] | null };
    const list = data ?? [];
    setIdeas(list);
    setIdeasLoaded(true);
    return list;
  }, [ideasLoaded, ideas]);

  const vote = useCallback(async (feedbackId: string) => {
    if (!currentUser) return;
    await supabase.from('app_feedback_votes').insert({ feedback_id: feedbackId, user_id: currentUser.id });
  }, [currentUser]);

  const unvote = useCallback(async (feedbackId: string) => {
    if (!currentUser) return;
    await supabase.from('app_feedback_votes').delete()
      .eq('feedback_id', feedbackId)
      .eq('user_id', currentUser.id);
  }, [currentUser]);

  function searchSimilar(query: string, list: AppFeedback[]): AppFeedback[] {
    if (!query?.trim() || !list?.length) return [];
    const q = query.toLowerCase();
    return list
      .filter(i => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q))
      .slice(0, 3);
  }

  const loadMyVotes = useCallback(async (): Promise<Set<string>> => {
    if (!currentUser) return new Set();
    const { data } = await supabase
      .from('app_feedback_votes')
      .select('feedback_id')
      .eq('user_id', currentUser.id) as { data: { feedback_id: string }[] | null };
    const ids = new Set<string>((data ?? []).map(r => r.feedback_id));
    try { localStorage.setItem('sl-my-votes', JSON.stringify([...ids])); } catch { /* ignore */ }
    return ids;
  }, [currentUser]);

  return { submit, fetchIdeas, vote, unvote, searchSimilar, ideas, loadMyVotes };
}
