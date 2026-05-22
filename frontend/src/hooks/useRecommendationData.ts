import { useState, useEffect, useMemo, useCallback } from 'react';
import { SectionState, MutualClassResult, FofResult, HobbyClusterResult } from '@/lib/types';
import { fetchJson } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';

export function useRecommendationData(currentUser: string, limit = 20) {
  const [mutual, setMutual] = useState<SectionState<MutualClassResult[]>>({
    status: 'loading',
    data: null,
    error: null,
  });
  const [fof, setFof] = useState<SectionState<FofResult[]>>({
    status: 'loading',
    data: null,
    error: null,
  });
  const [hobby, setHobby] = useState<SectionState<HobbyClusterResult[]>>({
    status: 'loading',
    data: null,
    error: null,
  });

  const urls = useMemo(() => {
    const p = new URLSearchParams({ userName: currentUser, limit: String(limit) });
    return {
      mutual: `/api/recommendations/mutual-classes?${p.toString()}`,
      fof: `/api/recommendations/fof?${p.toString()}`,
      hobby: `/api/recommendations/hobby-cluster?${p.toString()}`,
    };
  }, [currentUser, limit]);

  const fetchData = useCallback(async (signal: AbortSignal) => {
    setMutual({ status: 'loading', data: null, error: null });
    setFof({ status: 'loading', data: null, error: null });
    setHobby({ status: 'loading', data: null, error: null });

    try {
      const [mutualData, fofData, hobbyData] = await Promise.all([
        fetchJson<MutualClassResult[]>(urls.mutual, signal),
        fetchJson<FofResult[]>(urls.fof, signal),
        fetchJson<HobbyClusterResult[]>(urls.hobby, signal),
      ]);

      setMutual({ status: 'ready', data: mutualData ?? [], error: null });
      setFof({ status: 'ready', data: fofData ?? [], error: null });
      setHobby({ status: 'ready', data: hobbyData ?? [], error: null });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      
      const msg = getErrorMessage(err);
      setMutual({ status: 'error', data: null, error: msg });
      setFof({ status: 'error', data: null, error: msg });
      setHobby({ status: 'error', data: null, error: msg });
    }
  }, [urls]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  return { mutual, fof, hobby, refetch: () => fetchData(new AbortController().signal) };
}
