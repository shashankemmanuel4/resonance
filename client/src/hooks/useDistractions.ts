import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";
import { DistractionItem } from "../types/index.js";
import { useDataVersion } from "../context/DataVersionContext.js";

export function useDistractions() {
  const { dataVersion } = useDataVersion();
  const [data, setData] = useState<DistractionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDistractions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDistractions();
      setData(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDistractions();
  }, [fetchDistractions, dataVersion]);

  return {
    data,
    loading,
    error,
    refetch: fetchDistractions,
  };
}
