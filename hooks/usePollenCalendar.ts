"use client";

import useSWR from "swr";
import type { PollenCalendarResponse } from "@/app/api/region/[code]/pollen-calendar/route";

const fetcher = (url: string): Promise<PollenCalendarResponse> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("pollen calendar fetch failed");
    return r.json() as Promise<PollenCalendarResponse>;
  });

export function usePollenCalendar(regionCode: string | null) {
  const url = regionCode ? `/api/region/${regionCode}/pollen-calendar` : null;
  const { data, error, isLoading } = useSWR<PollenCalendarResponse>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 7 * 24 * 60 * 60 * 1000,
  });
  return { data, error, isLoading };
}
