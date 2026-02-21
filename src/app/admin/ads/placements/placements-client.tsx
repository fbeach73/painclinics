"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SettingsResponse = {
  adServerPercentage: number;
};

export function PlacementsClient() {
  const [adPercentage, setAdPercentage] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function fetchSettings() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/ads/settings");
      const data = (await r.json()) as SettingsResponse;
      setAdPercentage(data.adServerPercentage);
      setSliderValue(data.adServerPercentage);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  function saveSettings() {
    setSaving(true);
    setSaved(false);
    fetch("/api/admin/ads/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adServerPercentage: sliderValue }),
    })
      .then(() => {
        setAdPercentage(sliderValue);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      })
      .catch(() => setSaving(false));
  }

  useEffect(() => {
    void fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ad Server Traffic Split</CardTitle>
        <CardDescription>
          Percentage of page requests eligible to receive direct ads (vs.
          falling back to AdSense). Set to 0 to disable the direct ad server
          entirely.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="flex-1 h-2 accent-primary cursor-pointer"
              />
              <Badge
                variant="secondary"
                className="min-w-[56px] justify-center text-base font-mono"
              >
                {sliderValue}%
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={saveSettings}
                disabled={saving || sliderValue === adPercentage}
                size="sm"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
              {saved && (
                <span className="text-sm text-green-600 dark:text-green-400">
                  Saved
                </span>
              )}
              {sliderValue !== adPercentage && !saving && (
                <span className="text-xs text-muted-foreground">
                  Current: {adPercentage}% → New: {sliderValue}%
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
