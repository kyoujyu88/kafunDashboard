"use client";

import { useCallback, useEffect, useRef } from "react";
import type { AlertItem } from "@/hooks/useAllergyAlerts";

const COOLDOWN_MS = 4 * 60 * 60 * 1000;

function getLastNotified(metric: string): number {
  try {
    const v = window.localStorage.getItem(`kafun.notifiedAt:${metric}`);
    return v ? parseInt(v, 10) : 0;
  } catch {
    return 0;
  }
}

function setLastNotified(metric: string) {
  try {
    window.localStorage.setItem(`kafun.notifiedAt:${metric}`, String(Date.now()));
  } catch {
    // ignore
  }
}

export function useBrowserNotification(enabled: boolean, alerts: AlertItem[], regionName: string) {
  const lastSeenRef = useRef<string>("");

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) return "denied";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    try {
      return await Notification.requestPermission();
    } catch {
      return "denied";
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const fingerprint = alerts
      .filter((a) => a.level)
      .map((a) => `${a.metric}:${a.level}`)
      .join("|");
    if (!fingerprint || fingerprint === lastSeenRef.current) return;
    lastSeenRef.current = fingerprint;

    for (const a of alerts) {
      if (!a.level) continue;
      const last = getLastNotified(a.metric);
      if (Date.now() - last < COOLDOWN_MS) continue;
      try {
        new Notification(`${a.label}が${a.level === "very_high" ? "非常に多く" : "多く"}なっています`, {
          body: `${regionName} 現在: ${a.currentValue?.toFixed(1) ?? "—"}`,
          tag: `kafun-${a.metric}`,
        });
        setLastNotified(a.metric);
      } catch {
        // ignore
      }
    }
  }, [enabled, alerts, regionName]);

  return { requestPermission };
}
