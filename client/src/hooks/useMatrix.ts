import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";
import { MatrixItem } from "../types/index.js";
import { useDataVersion } from "../context/DataVersionContext.js";

export function useMatrix() {
  const { dataVersion } = useDataVersion();
  const [data, setData] = useState<MatrixItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatrix = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMatrix();
      setData(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMatrix();
  }, [fetchMatrix, dataVersion]);

  return {
    data,
    loading,
    error,
    refetch: fetchMatrix,
  };
}
