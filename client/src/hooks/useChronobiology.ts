import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";
import { ChronobiologyItem } from "../types/index.js";
import { useDataVersion } from "../context/DataVersionContext.js";

export function useChronobiology(timezone?: string) {
  const { dataVersion } = useDataVersion();
  const [data, setData] = useState<ChronobiologyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChronobiology = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getChronobiology(timezone);
      setData(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [timezone]);

  useEffect(() => {
    void fetchChronobiology();
  }, [fetchChronobiology, dataVersion]);

  return {
    data,
    loading,
    error,
    refetch: fetchChronobiology,
  };
}
