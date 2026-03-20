import { useEffect, useState } from 'react';
import { loadRepresentativesFromExcelFile } from '@/lib/representatives-loader';
import type { Representative } from '@/types/representative';

export function useLoadRepresentativesFromExcel() {
  const [data, setData] = useState<Representative[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const representatives = await loadRepresentativesFromExcelFile();
        setData(representatives);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { data, loading, error };
}
