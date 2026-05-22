import { useState, useEffect } from 'react';
import { fetchRelationGraphAction } from '@/app/actions/auth';

export function useCandidateRelation(currentUser: string, candidateName: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateName) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetchRelationGraphAction(currentUser, candidateName)
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Failed to fetch relation graph');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [currentUser, candidateName]);

  return { data, loading, error };
}
