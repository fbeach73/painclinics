"use client";

import useSWR from "swr";

import type { AnalyticsData, ClinicAnalytics, DateRange } from "@/types/analytics";

/**
 * Keywords response type for the keywords analytics endpoint
 */
interface KeywordAggregation {
  keyword: string;
  totalCount: number;
  clinicCount: number;
  avgPerClinic: number;
  sentiment: "positive" | "neutral" | "negative";
}

export interface KeywordsResponse {
  keywords: KeywordAggregation[];
  summary: {
    totalKeywords: number;
    clinicsAnalyzed: number;
    sentiment: { positive: number; neutral: number; negative: number };
  };
  filters: {
    state: string | null;
    city: string | null;
    limit: number;
  };
}

/**
 * Generic fetcher for SWR
 */
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

/**
 * Hook for fetching admin traffic analytics
 */
export function useTrafficAnalytics(range: DateRange) {
  const { data, error, isLoading, mutate } = useSWR<AnalyticsData>(
    `/api/admin/analytics?range=${range}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

/**
 * Hook for fetching clinic-specific analytics (owner dashboard)
 */
export function useClinicAnalytics(clinicId: string) {
  const { data, error, isLoading } = useSWR<ClinicAnalytics>(
    clinicId ? `/api/owner/analytics?clinicId=${clinicId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
  };
}

/**
 * Hook for fetching keywords analytics
 */
export function useKeywordsAnalytics(stateFilter: string) {
  const params = new URLSearchParams();
  if (stateFilter && stateFilter !== "all") {
    params.set("state", stateFilter);
  }
  params.set("limit", "50");

  const { data, error, isLoading, mutate } = useSWR<KeywordsResponse>(
    `/api/admin/analytics/keywords?${params}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
