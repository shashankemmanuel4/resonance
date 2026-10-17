import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";
import { AnalyticsSummary } from "../types/index.js";
import { useDataVersion } from "../context/DataVersionContext.js";

export function useSummary() {
  const { dataVersion } = useDataVersion();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSummary();
      setData(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary, dataVersion]);

  return {
    data,
    loading,
    error,
    refetch: fetchSummary,
  };
}
