export interface SafecastMeasurement {
  id: number;
  value: number;
  unit: string;
  latitude: number;
  longitude: number;
  captured_at: string;
}

export interface RadiationResult {
  valueMicroSvH: number | null;
  count: number;
  latestAt: string | null;
  /** ok = enough samples; sparse = < 10 samples; nodata = 0 samples */
  status: "ok" | "sparse" | "nodata";
}

/** SBM-20 Geiger-Müller tube calibration for Cs-137 (used in SAFECAST bGeigie Nano) */
const CPM_TO_USV_H = 1 / 334;

export async function fetchRadiation(lat: number, lng: number): Promise<RadiationResult> {
  const capturedAfter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");

  // First try 100 km radius; expand to 300 km if sparse
  let measurements = await querySafecast(lat, lng, 100, capturedAfter);
  if (measurements.length < 5) {
    measurements = await querySafecast(lat, lng, 300, capturedAfter);
  }

  if (measurements.length === 0) {
    return { valueMicroSvH: null, count: 0, latestAt: null, status: "nodata" };
  }

  // Convert CPM → µSv/h (filter implausible values)
  const values = measurements
    .filter((m) => m.unit === "cpm" && m.value > 0 && m.value < 10000)
    .map((m) => m.value * CPM_TO_USV_H);

  if (values.length === 0) {
    return { valueMicroSvH: null, count: measurements.length, latestAt: null, status: "nodata" };
  }

  values.sort((a, b) => a - b);
  const median = values[Math.floor(values.length / 2)];

  return {
    valueMicroSvH: Math.round(median * 10000) / 10000,
    count: measurements.length,
    latestAt: measurements[0]?.captured_at ?? null,
    status: measurements.length < 10 ? "sparse" : "ok",
  };
}

async function querySafecast(
  lat: number,
  lng: number,
  distanceKm: number,
  capturedAfter: string
): Promise<SafecastMeasurement[]> {
  try {
    const url = new URL("https://api.safecast.org/measurements.json");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("distance", String(distanceKm));
    url.searchParams.set("captured_after", capturedAfter);
    url.searchParams.set("limit", "200");
    url.searchParams.set("order", "captured_at");
    url.searchParams.set("sort", "desc");

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as SafecastMeasurement[]) : [];
  } catch {
    return [];
  }
}
