"use client";

import useSWR from "swr";
import type { WeatherResponse } from "@/lib/weather.types";

const fetcher = (url: string): Promise<WeatherResponse> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("weather fetch error");
    return r.json() as Promise<WeatherResponse>;
  });

export function useWeather(regionCode: string | null) {
  const { data, error, isLoading } = useSWR<WeatherResponse>(
    regionCode ? `/api/region/${regionCode}/weather` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000,
      refreshInterval: 60 * 60 * 1000,
    }
  );

  return { data, error, isLoading };
}
