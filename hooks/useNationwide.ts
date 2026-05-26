"use client";

import useSWR from "swr";
import type { PrefectureSnapshot } from "@/lib/openMeteo.types";

async function fetcher(url: string): Promise<PrefectureSnapshot[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as PrefectureSnapshot[];
}

export function useNationwide() {
  const { data, error, isLoading } = useSWR<PrefectureSnapshot[]>("/api/nationwide", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30 * 60 * 1000,
    refreshInterval: 60 * 60 * 1000,
  });
  return { data, error, isLoading };
}
