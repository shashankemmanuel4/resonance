import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";
import { Moment, MomentsResponse } from "../types/index.js";
import { useDataVersion } from "../context/DataVersionContext.js";

interface UseMomentsOptions {
  page?: number;
  limit?: number;
  category?: string;
  location?: string;
  minFocus?: number;
  dateFrom?: string;
  dateTo?: string;
}

export function useMoments(options: UseMomentsOptions = {}) {
  const { dataVersion } = useDataVersion();
  const [data, setData] = useState<MomentsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Stable key to detect option changes
  const optionsKey = JSON.stringify(options);

  const fetchMoments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMoments(options);
      setData(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [optionsKey]);

  useEffect(() => {
    void fetchMoments();
  }, [fetchMoments, dataVersion]);

  const removeLocally = useCallback((id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        moments: prev.moments.filter((m) => m._id !== id),
        total: Math.max(0, prev.total - 1),
      };
    });
  }, []);

  const restoreLocally = useCallback((moment: Moment) => {
    setData((prev) => {
      if (!prev) return prev;
      // Insert at beginning (newest first)
      return {
        ...prev,
        moments: [moment, ...prev.moments],
        total: prev.total + 1,
      };
    });
  }, []);

  return {
    data,
    moments: data?.moments ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pages: data?.pages ?? 1,
    loading,
    error,
    refetch: fetchMoments,
    removeLocally,
    restoreLocally,
  };
}
