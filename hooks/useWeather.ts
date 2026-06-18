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
      // ユーザーがタブに戻ったら鮮度をチェックしたい(古い値を信じない)。
      revalidateOnFocus: true,
      dedupingInterval: 5 * 60 * 1000,
      refreshInterval: 10 * 60 * 1000,
    }
  );

  return { data, error, isLoading };
}
