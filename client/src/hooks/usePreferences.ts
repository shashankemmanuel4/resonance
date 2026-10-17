import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";

export function usePreferences() {
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPreferences();
      if (data.timezone) {
        setTimezone(data.timezone);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPreferences();
  }, [fetchPreferences]);

  const updateTimezone = useCallback(async (newTz: string) => {
    try {
      const data = await api.updatePreferences(newTz);
      setTimezone(data.timezone);
      return data.timezone;
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    timezone,
    loading,
    error,
    refetch: fetchPreferences,
    updateTimezone,
  };
}
