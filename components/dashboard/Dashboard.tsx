"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CurrentMetricsGrid } from "@/components/dashboard/CurrentMetricsGrid";
import { HeroSummaryCard } from "@/components/dashboard/HeroSummary";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { JapanHeatmap } from "@/components/dashboard/JapanHeatmap";
import { RegionSheet } from "@/components/dashboard/RegionSheet";
import { BetaNotice } from "@/components/dashboard/BetaNotice";
import { WatchAlertBanner } from "@/components/dashboard/WatchAlertBanner";
import { RadiationCard } from "@/components/dashboard/RadiationCard";
import { WeatherSummaryCard } from "@/components/dashboard/WeatherSummaryCard";
import { LifeIndicesCard } from "@/components/dashboard/LifeIndicesCard";
import { HistoryPanel } from "@/components/dashboard/HistoryPanel";
import { WatchSettings } from "@/components/settings/WatchSettings";
import { OnboardingDialog } from "@/components/settings/OnboardingDialog";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { useAirQuality } from "@/hooks/useAirQuality";
import { useWeather } from "@/hooks/useWeather";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useWatchAlerts } from "@/hooks/useWatchAlerts";
import { useWatchProfile } from "@/hooks/useWatchProfile";
import { useBrowserNotification } from "@/hooks/useBrowserNotification";
import { usePersistedRegion } from "@/hooks/usePersistedRegion";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { computeLifeIndices } from "@/lib/lifeIndex";
import { computeHeroSummary } from "@/lib/heroSummary";
import { getPrefecture } from "@/lib/regions";
import { formatRelative } from "@/lib/format";
import type { MetricKey } from "@/lib/openMeteo.types";

export function Dashboard() {
  const { code: regionCode, setCode: setRegionCode, hydrated: regionHydrated } = usePersistedRegion();
  const region = getPrefecture(regionCode);
  const { data, isLoading } = useAirQuality(region?.lat ?? null, region?.lng ?? null);
  const { data: weather } = useWeather(regionCode);

  const {
    profile,
    hydrated: profileHydrated,
    save,
    update,
    togglePollen,
    toggleAir,
    reset,
  } = useWatchProfile();

  const { alerts, highestLevel } = useWatchAlerts(profile, data);
  const { requestPermission } = useBrowserNotification(
    profile.enableBrowserNotification,
    alerts,
    region?.name ?? ""
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);

  const isDesktop = useIsDesktop();
  const { focusOnly, toggle: toggleFocus } = useFocusMode();

  useEffect(() => {
    if (profileHydrated && !profile.onboarded) {
      const t = setTimeout(() => setOnboardingOpen(true), 500);
      return () => clearTimeout(t);
    }
  }, [profileHydrated, profile.onboarded]);

  const highlightKeys = useMemo<MetricKey[]>(
    () => [...profile.pollens, ...profile.airQuality],
    [profile.pollens, profile.airQuality]
  );
  const hasProfile = highlightKeys.length > 0 && profile.onboarded;

  const lifeIndices = useMemo(
    () => computeLifeIndices({ air: data, weather, profile }),
    [data, weather, profile]
  );

  const heroSummary = useMemo(
    () => computeHeroSummary(data, highlightKeys),
    [data, highlightKeys]
  );

  const defaultChartMetric: MetricKey = highlightKeys[0] ?? "pm2_5";
  const defaultMapMetric: MetricKey = highlightKeys[0] ?? "pm2_5";
  const chartMetric: MetricKey = selectedMetric ?? defaultChartMetric;

  const lastUpdated = data?.current?.time ? formatRelative(new Date(data.current.time).getTime()) : null;

  return (
    <>
      <Header
        regionName={region?.name ?? "—"}
        onOpenRegion={() => setSheetOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        lastUpdated={lastUpdated}
      />

      <main className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-5">
        <div className="space-y-3 sm:space-y-4 lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0">
          <div className="space-y-3 sm:space-y-4 lg:col-span-2">
            <BetaNotice />

            <WatchAlertBanner
              alerts={alerts}
              highestLevel={highestLevel}
              hasProfile={hasProfile}
              regionName={region?.name ?? ""}
            />

            <HeroSummaryCard summary={heroSummary} onSelectMetric={setSelectedMetric} />

            <WeatherSummaryCard data={weather} />

            <AnimatePresence mode="wait">
              <motion.section
                key={regionCode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                aria-live="polite"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold sm:text-lg">
                    {region?.name}
                    <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                      {region?.capital}
                    </span>
                  </h2>
                  {hasProfile && (
                    <button
                      type="button"
                      onClick={toggleFocus}
                      aria-pressed={focusOnly}
                      className={
                        focusOnly
                          ? "shrink-0 rounded-full bg-cyan-600 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm transition active:scale-95"
                          : "shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
                      }
                    >
                      {focusOnly ? "⭐ 注目のみ表示中" : "⭐ 注目のみ表示"}
                    </button>
                  )}
                </div>
                <CurrentMetricsGrid
                  data={data}
                  isLoading={isLoading || !regionHydrated}
                  regionCode={regionCode}
                  highlightKeys={highlightKeys}
                  selectedMetric={chartMetric}
                  onSelectMetric={setSelectedMetric}
                  focusOnly={focusOnly}
                />
                {lifeIndices.length > 0 && (
                  <div className="mt-2 sm:mt-3">
                    <LifeIndicesCard indices={lifeIndices} />
                  </div>
                )}
                <div className="mt-2 sm:mt-3">
                  <RadiationCard regionCode={regionCode} />
                </div>
              </motion.section>
            </AnimatePresence>

            <ForecastChart data={data} weather={weather} metric={chartMetric} />

            <CollapsibleSection title="履歴・トレンドを見る">
              <HistoryPanel regionCode={regionCode} selectedMetric={chartMetric} />
            </CollapsibleSection>

            <div className="lg:hidden">
              <CollapsibleSection title="全国マップを見る">
                <JapanHeatmap
                  selectedCode={regionCode}
                  onSelect={setRegionCode}
                  defaultMetric={defaultMapMetric}
                />
              </CollapsibleSection>
            </div>
          </div>

          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <JapanHeatmap
              selectedCode={regionCode}
              onSelect={setRegionCode}
              defaultMetric={defaultMapMetric}
            />
          </aside>
        </div>

        <Footer />
      </main>

      <RegionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        currentCode={regionCode}
        onSelect={setRegionCode}
      />

      <WatchSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        profile={profile}
        onTogglePollen={togglePollen}
        onToggleAir={toggleAir}
        onUpdate={update}
        onReset={reset}
        onRequestNotification={requestPermission}
      />

      <OnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onSave={(patch) => save({ ...profile, ...patch, updatedAt: Date.now() })}
      />

      {/* avoid unused warning for isDesktop in future, kept for SSR-aware layouts */}
      <span className="hidden">{String(isDesktop)}</span>
    </>
  );
}
