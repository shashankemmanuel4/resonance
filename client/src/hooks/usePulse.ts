import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";
import { PulseData } from "../types/index.js";
import { useDataVersion } from "../context/DataVersionContext.js";

export function usePulse(timezone?: string) {
  const { dataVersion } = useDataVersion();
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPulse = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPulse(timezone);
      setData(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [timezone]);

  useEffect(() => {
    void fetchPulse();
  }, [fetchPulse, dataVersion]);

  return {
    data,
    loading,
    error,
    refetch: fetchPulse,
  };
}
