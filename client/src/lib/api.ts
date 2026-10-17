import {
  ApiResponse,
  Moment,
  MomentsResponse,
  PulseData,
  MatrixItem,
  ChronobiologyItem,
  DistractionItem,
  AnalyticsSummary,
  UserPreferences,
  CreateMomentInput,
} from "../types/index.js";

class ApiError extends Error {
  details: unknown[];
  status: number;

  constructor(message: string, status: number, details: unknown[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    const errorMsg = body.error?.message ?? `Request failed with status ${response.status}`;
    const details = body.error?.details ?? [];
    throw new ApiError(errorMsg, response.status, details);
  }

  return body.data;
}

export const api = {
  // Moments
  async getMoments(params?: {
    page?: number;
    limit?: number;
    category?: string;
    location?: string;
    minFocus?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<MomentsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.category) searchParams.set("category", params.category);
    if (params?.location) searchParams.set("location", params.location);
    if (params?.minFocus) searchParams.set("minFocus", String(params.minFocus));
    if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.set("dateTo", params.dateTo);

    const query = searchParams.toString();
    const url = query ? `/api/moments?${query}` : "/api/moments";
    return fetchJson<MomentsResponse>(url);
  },

  async getMoment(id: string): Promise<{ moment: Moment }> {
    return fetchJson<{ moment: Moment }>(`/api/moments/${encodeURIComponent(id)}`);
  },

  async createMoment(input: CreateMomentInput): Promise<{ moment: Moment }> {
    return fetchJson<{ moment: Moment }>("/api/moments", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async deleteMoment(id: string): Promise<{ deletedId: string }> {
    return fetchJson<{ deletedId: string }>(`/api/moments/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  // Analytics
  async getPulse(timezone?: string): Promise<PulseData> {
    const url = timezone ? `/api/analytics/pulse?tz=${encodeURIComponent(timezone)}` : "/api/analytics/pulse";
    return fetchJson<PulseData>(url);
  },

  async getMatrix(): Promise<MatrixItem[]> {
    return fetchJson<MatrixItem[]>("/api/analytics/matrix");
  },

  async getChronobiology(timezone?: string): Promise<ChronobiologyItem[]> {
    const url = timezone
      ? `/api/analytics/chronobiology?tz=${encodeURIComponent(timezone)}`
      : "/api/analytics/chronobiology";
    return fetchJson<ChronobiologyItem[]>(url);
  },

  async getDistractions(): Promise<DistractionItem[]> {
    return fetchJson<DistractionItem[]>("/api/analytics/distractions");
  },

  async getSummary(): Promise<AnalyticsSummary> {
    return fetchJson<AnalyticsSummary>("/api/analytics/summary");
  },

  // Preferences
  async getPreferences(): Promise<UserPreferences> {
    return fetchJson<UserPreferences>("/api/user/preferences");
  },

  async updatePreferences(timezone: string): Promise<UserPreferences> {
    return fetchJson<UserPreferences>("/api/user/preferences", {
      method: "PATCH",
      body: JSON.stringify({ timezone }),
    });
  },

  // Demo Controls
  async seedDemo(): Promise<{ insertedCount: number; message: string }> {
    return fetchJson<{ insertedCount: number; message: string }>("/api/demo/seed", {
      method: "POST",
    });
  },

  async resetDemo(): Promise<{ deletedCount: number }> {
    return fetchJson<{ deletedCount: number }>("/api/demo/reset", {
      method: "DELETE",
      body: JSON.stringify({ confirm: true }),
    });
  },
};
