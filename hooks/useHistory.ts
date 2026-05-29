"use client";

import useSWR from "swr";
import type { OpenMeteoResponse } from "@/lib/openMeteo.types";

export interface HistoryData {
  current: OpenMeteoResponse;
  previousYear?: OpenMeteoResponse;
  range: { startDate: string; endDate: string };
}

const fetcher = (url: string): Promise<HistoryData> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("history fetch failed");
    return r.json() as Promise<HistoryData>;
  });

export interface UseHistoryOptions {
  days?: number;
  compare?: "yoy";
}

export function useHistory(
  regionCode: string | null,
  opts: UseHistoryOptions = {}
) {
  const { days = 7, compare } = opts;
  const url = regionCode
    ? `/api/region/${regionCode}/history?days=${days}${compare === "yoy" ? "&compare=yoy" : ""}`
    : null;
  const { data, error, isLoading } = useSWR<HistoryData>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 24 * 60 * 60 * 1000,
  });
  return { data, error, isLoading };
}
