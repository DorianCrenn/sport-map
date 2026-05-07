import { useState, useCallback } from 'react';

const KEY = 'club-requests';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } };
const save = d => localStorage.setItem(KEY, JSON.stringify(d));

export function useClubRequests() {
  const [requests, setRequests] = useState(load);

  const submitRequest = useCallback((data) => {
    const req = {
      id: `req_${Date.now()}`,
      userId: data.userId,
      userName: data.userName,
      clubName: data.clubName,
      sport: data.sport,
      city: data.city,
      description: data.description ?? '',
      requestedAt: new Date().toISOString(),
      status: 'pending',
      reviewedAt: null,
      reviewNote: '',
    };
    setRequests(prev => { const next = [...prev, req]; save(next); return next; });
    return req;
  }, []);

  const reviewRequest = useCallback((id, status, note = '') => {
    setRequests(prev => {
      const next = prev.map(r =>
        r.id === id ? { ...r, status, reviewNote: note, reviewedAt: new Date().toISOString() } : r
      );
      save(next);
      return next;
    });
  }, []);

  return {
    requests,
    pendingRequests: requests.filter(r => r.status === 'pending'),
    approvedRequests: requests.filter(r => r.status === 'approved'),
    submitRequest,
    reviewRequest,
  };
}
