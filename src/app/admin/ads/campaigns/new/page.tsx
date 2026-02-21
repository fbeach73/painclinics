"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewCampaignPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    advertiserName: "",
    advertiserEmail: "",
    advertiserUrl: "",
    status: "paused" as "active" | "paused" | "ended",
    startDate: "",
    endDate: "",
    dailyBudgetCents: "",
    totalBudgetCents: "",
    notes: "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function parseCents(raw: string): number | undefined {
    if (!raw.trim()) return undefined;
    const dollars = parseFloat(raw);
    if (isNaN(dollars)) return undefined;
    return Math.round(dollars * 100);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Campaign name is required.");
      return;
    }
    if (!form.advertiserName.trim()) {
      setError("Advertiser name is required.");
      return;
    }

    setSaving(true);

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      advertiserName: form.advertiserName.trim(),
      status: form.status,
    };
    if (form.advertiserEmail.trim()) body.advertiserEmail = form.advertiserEmail.trim();
    if (form.advertiserUrl.trim()) body.advertiserUrl = form.advertiserUrl.trim();
    if (form.startDate) body.startDate = form.startDate;
    if (form.endDate) body.endDate = form.endDate;
    const daily = parseCents(form.dailyBudgetCents);
    if (daily !== undefined) body.dailyBudgetCents = daily;
    const total = parseCents(form.totalBudgetCents);
    if (total !== undefined) body.totalBudgetCents = total;
    if (form.notes.trim()) body.notes = form.notes.trim();

    try {
      const res = await fetch("/api/admin/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json() as { campaign?: { id: string }; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to create campaign.");
        setSaving(false);
        return;
      }

      router.push(`/admin/ads/campaigns/${data.campaign!.id}`);
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/ads/campaigns">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Campaign</h1>
          <p className="text-muted-foreground">Create a new ad campaign</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Basic campaign information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Spring 2026 Awareness"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as "active" | "paused" | "ended")}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyBudget">Daily Budget ($)</Label>
                <Input
                  id="dailyBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.dailyBudgetCents}
                  onChange={(e) => set("dailyBudgetCents", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalBudget">Total Budget ($)</Label>
                <Input
                  id="totalBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalBudgetCents}
                  onChange={(e) => set("totalBudgetCents", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Internal notes about this campaign…"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advertiser Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="advertiserName">Advertiser Name *</Label>
              <Input
                id="advertiserName"
                value={form.advertiserName}
                onChange={(e) => set("advertiserName", e.target.value)}
                placeholder="Acme Pain Solutions"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advertiserEmail">Advertiser Email</Label>
              <Input
                id="advertiserEmail"
                type="email"
                value={form.advertiserEmail}
                onChange={(e) => set("advertiserEmail", e.target.value)}
                placeholder="contact@advertiser.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advertiserUrl">Advertiser Website</Label>
              <Input
                id="advertiserUrl"
                type="url"
                value={form.advertiserUrl}
                onChange={(e) => set("advertiserUrl", e.target.value)}
                placeholder="https://advertiser.com"
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create Campaign"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/ads/campaigns">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
