import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useFeedback() {
  const { currentUser } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [ideasLoaded, setIdeasLoaded] = useState(false);

  const submit = useCallback(async ({ type, title, description, category, pageUrl, browserInfo, appVersion }) => {
    if (!currentUser) throw new Error('Non connecté');
    const { error } = await supabase.from('app_feedback').insert({
      user_id:      currentUser.id,
      club_id:      currentUser.clubId ?? null,
      type,
      category:     category || null,
      title:        title.trim(),
      description:  description?.trim() || null,
      page_url:     pageUrl || null,
      browser_info: browserInfo || {},
      app_version:  appVersion || null,
    });
    if (error) throw error;
  }, [currentUser]);

  const fetchIdeas = useCallback(async () => {
    if (ideasLoaded) return ideas;
    const { data } = await supabase
      .from('app_feedback')
      .select('id, title, description, status, created_at')
      .eq('type', 'idea')
      .is('merged_into', null)
      .order('created_at', { ascending: false })
      .limit(50);
    const list = data ?? [];
    setIdeas(list);
    setIdeasLoaded(true);
    return list;
  }, [ideasLoaded, ideas]);

  const vote = useCallback(async (feedbackId) => {
    if (!currentUser) return;
    await supabase.from('app_feedback_votes').insert({ feedback_id: feedbackId, user_id: currentUser.id });
  }, [currentUser]);

  const unvote = useCallback(async (feedbackId) => {
    if (!currentUser) return;
    await supabase.from('app_feedback_votes').delete()
      .eq('feedback_id', feedbackId)
      .eq('user_id', currentUser.id);
  }, [currentUser]);

  function searchSimilar(query, list) {
    if (!query?.trim() || !list?.length) return [];
    const q = query.toLowerCase();
    return list
      .filter(i => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q))
      .slice(0, 3);
  }

  return { submit, fetchIdeas, vote, unvote, searchSimilar, ideas };
}
