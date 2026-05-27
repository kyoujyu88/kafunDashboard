"use client";

import useSWR from "swr";
import { fetchPointAirQuality } from "@/lib/openMeteo";
import type { OpenMeteoResponse } from "@/lib/openMeteo.types";

export function useAirQuality(lat: number | null, lng: number | null) {
  const { data, error, isLoading, mutate } = useSWR<OpenMeteoResponse>(
    lat !== null && lng !== null ? ["air", lat, lng] : null,
    () => fetchPointAirQuality(lat as number, lng as number, { forecastDays: 5 }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000,
      refreshInterval: 30 * 60 * 1000,
    }
  );

  return { data, error, isLoading, mutate };
}
