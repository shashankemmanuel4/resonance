import { useState, useCallback } from "react";
import { api } from "../lib/api.js";
import { Moment, CreateMomentInput } from "../types/index.js";

export function useCreateMoment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (input: CreateMomentInput): Promise<Moment | null> => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.createMoment(input);
      return res.moment;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}
