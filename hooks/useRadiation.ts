"use client";

import useSWR from "swr";
import type { RadiationResult } from "@/lib/safecast";

const fetcher = (url: string): Promise<RadiationResult> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("radiation fetch error");
    return r.json() as Promise<RadiationResult>;
  });

export function useRadiation(code: string | null) {
  const { data, isLoading, error } = useSWR<RadiationResult>(
    code ? `/api/radiation?code=${code}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3_600_000, // 1 hour
    }
  );

  return { data, isLoading, error };
}
