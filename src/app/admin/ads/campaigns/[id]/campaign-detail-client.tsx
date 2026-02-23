"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, Edit2, Copy, Check, X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

type Campaign = {
  id: string;
  name: string;
  advertiserName: string;
  advertiserEmail: string | null;
  advertiserUrl: string | null;
  status: "active" | "paused" | "ended";
  startDate: Date | null;
  endDate: Date | null;
  dailyBudgetCents: number | null;
  totalBudgetCents: number | null;
  notes: string | null;
};

type AspectRatio = "1:1" | "16:9" | "21:9" | "4:3" | "3:2" | "auto";

type Creative = {
  id: string;
  name: string;
  creativeType: "image_banner" | "html" | "text" | "native";
  aspectRatio: AspectRatio;
  destinationUrl: string;
  headline: string | null;
  bodyText: string | null;
  ctaText: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  htmlContent: string | null;
  weight: number;
  isActive: boolean;
};

type Placement = {
  id: string;
  name: string;
  label: string;
  pageType: string;
  assignmentId: string | null;
  assignmentWeight: number | null;
};

type AllPlacement = {
  id: string;
  name: string;
  label: string;
  pageType: string;
};

type CreativeStats = Record<string, { impressions: number; clicks: number }>;

type Props = {
  campaign: Campaign;
  creatives: Creative[];
  assignedPlacements: Placement[];
  allPlacements: AllPlacement[];
  creativeStats: CreativeStats;
};

function statusBadge(status: "active" | "paused" | "ended") {
  if (status === "active")
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">Active</Badge>;
  if (status === "paused")
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0">Paused</Badge>;
  return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0">Ended</Badge>;
}

function formatDateInput(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0] ?? "";
}

export function CampaignDetailClient({
  campaign: initialCampaign,
  creatives: initialCreatives,
  assignedPlacements: initialAssigned,
  allPlacements,
  creativeStats,
}: Props) {
  const router = useRouter();
  const [campaign, setCampaign] = useState(initialCampaign);
  const [creatives, setCreatives] = useState(initialCreatives);
  const [assignedPlacements, setAssignedPlacements] = useState(initialAssigned);

  // ── Campaign edit state ──────────────────────────────────────────────
  const [editingCampaign, setEditingCampaign] = useState(false);
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: campaign.name,
    advertiserName: campaign.advertiserName,
    advertiserEmail: campaign.advertiserEmail ?? "",
    advertiserUrl: campaign.advertiserUrl ?? "",
    status: campaign.status,
    startDate: formatDateInput(campaign.startDate),
    endDate: formatDateInput(campaign.endDate),
    dailyBudgetCents: campaign.dailyBudgetCents
      ? (campaign.dailyBudgetCents / 100).toFixed(2)
      : "",
    totalBudgetCents: campaign.totalBudgetCents
      ? (campaign.totalBudgetCents / 100).toFixed(2)
      : "",
    notes: campaign.notes ?? "",
  });

  function setCampaignField(field: keyof typeof campaignForm, value: string) {
    setCampaignForm((prev) => ({ ...prev, [field]: value }));
  }

  function parseCents(raw: string): number | undefined {
    if (!raw.trim()) return undefined;
    const dollars = parseFloat(raw);
    if (isNaN(dollars)) return undefined;
    return Math.round(dollars * 100);
  }

  async function saveCampaign() {
    setCampaignSaving(true);
    const body: Record<string, unknown> = {
      name: campaignForm.name,
      advertiserName: campaignForm.advertiserName,
      advertiserEmail: campaignForm.advertiserEmail || undefined,
      advertiserUrl: campaignForm.advertiserUrl || undefined,
      status: campaignForm.status,
      startDate: campaignForm.startDate || undefined,
      endDate: campaignForm.endDate || undefined,
      notes: campaignForm.notes || undefined,
    };
    const daily = parseCents(campaignForm.dailyBudgetCents);
    if (daily !== undefined) body.dailyBudgetCents = daily;
    const total = parseCents(campaignForm.totalBudgetCents);
    if (total !== undefined) body.totalBudgetCents = total;

    const res = await fetch(`/api/admin/ads/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { campaign?: Campaign };
    if (res.ok && data.campaign) {
      setCampaign(data.campaign);
    }
    setCampaignSaving(false);
    setEditingCampaign(false);
  }

  async function deleteCampaign() {
    if (!confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`))
      return;
    await fetch(`/api/admin/ads/campaigns/${campaign.id}`, { method: "DELETE" });
    router.push("/admin/ads/campaigns");
  }

  // ── Creative state ───────────────────────────────────────────────────
  const [addCreativeOpen, setAddCreativeOpen] = useState(false);
  const [creativeForm, setCreativeForm] = useState({
    name: "",
    creativeType: "text" as "image_banner" | "html" | "text" | "native",
    aspectRatio: "auto" as AspectRatio,
    destinationUrl: "",
    headline: "",
    bodyText: "",
    ctaText: "",
    imageUrl: "",
    imageAlt: "",
    htmlContent: "",
    weight: "1",
  });
  const [creativeSaving, setCreativeSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  function setCreativeField(field: keyof typeof creativeForm, value: string) {
    setCreativeForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/ads/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json() as { url?: string; error?: string };
      if (res.ok && data.url) {
        setCreativeField("imageUrl", data.url);
      } else {
        alert(data.error ?? "Upload failed");
      }
    } catch {
      alert("Upload failed");
    }
    setImageUploading(false);
  }

  async function addCreative() {
    setCreativeSaving(true);
    const body: Record<string, unknown> = {
      campaignId: campaign.id,
      name: creativeForm.name,
      creativeType: creativeForm.creativeType,
      aspectRatio: creativeForm.aspectRatio,
      destinationUrl: creativeForm.destinationUrl,
      weight: parseInt(creativeForm.weight) || 1,
    };
    if (creativeForm.headline) body.headline = creativeForm.headline;
    if (creativeForm.bodyText) body.bodyText = creativeForm.bodyText;
    if (creativeForm.ctaText) body.ctaText = creativeForm.ctaText;
    if (creativeForm.imageUrl) body.imageUrl = creativeForm.imageUrl;
    if (creativeForm.imageAlt) body.imageAlt = creativeForm.imageAlt;
    if (creativeForm.htmlContent) body.htmlContent = creativeForm.htmlContent;

    const res = await fetch("/api/admin/ads/creatives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { creative?: Creative };
    if (res.ok && data.creative) {
      setCreatives((prev) => [...prev, data.creative!]);
      setAddCreativeOpen(false);
      setCreativeForm({
        name: "",
        creativeType: "text",
        aspectRatio: "auto",
        destinationUrl: "",
        headline: "",
        bodyText: "",
        ctaText: "",
        imageUrl: "",
        imageAlt: "",
        htmlContent: "",
        weight: "1",
      });
    }
    setCreativeSaving(false);
  }

  async function toggleCreativeActive(creativeId: string, isActive: boolean) {
    const res = await fetch(`/api/admin/ads/creatives/${creativeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    const data = await res.json() as { creative?: Creative };
    if (res.ok && data.creative) {
      setCreatives((prev) =>
        prev.map((c) => (c.id === creativeId ? data.creative! : c))
      );
    }
  }

  async function deleteCreative(creativeId: string) {
    if (!confirm("Delete this creative?")) return;
    const res = await fetch(`/api/admin/ads/creatives/${creativeId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCreatives((prev) => prev.filter((c) => c.id !== creativeId));
    }
  }

  function cloneCreative(c: Creative) {
    setCreativeForm({
      name: `${c.name} (copy)`,
      creativeType: c.creativeType,
      aspectRatio: c.aspectRatio,
      destinationUrl: c.destinationUrl,
      headline: c.headline ?? "",
      bodyText: c.bodyText ?? "",
      ctaText: c.ctaText ?? "",
      imageUrl: c.imageUrl ?? "",
      imageAlt: c.imageAlt ?? "",
      htmlContent: c.htmlContent ?? "",
      weight: String(c.weight),
    });
    setAddCreativeOpen(true);
  }

  // ── Edit creative state ──────────────────────────────────────────────
  const [editCreativeId, setEditCreativeId] = useState<string | null>(null);
  const [editCreativeOpen, setEditCreativeOpen] = useState(false);

  function openEditCreative(c: Creative) {
    setEditCreativeId(c.id);
    setCreativeForm({
      name: c.name,
      creativeType: c.creativeType,
      aspectRatio: c.aspectRatio,
      destinationUrl: c.destinationUrl,
      headline: c.headline ?? "",
      bodyText: c.bodyText ?? "",
      ctaText: c.ctaText ?? "",
      imageUrl: c.imageUrl ?? "",
      imageAlt: c.imageAlt ?? "",
      htmlContent: c.htmlContent ?? "",
      weight: String(c.weight),
    });
    setEditCreativeOpen(true);
  }

  async function saveEditCreative() {
    if (!editCreativeId) return;
    setCreativeSaving(true);
    const body: Record<string, unknown> = {
      name: creativeForm.name,
      creativeType: creativeForm.creativeType,
      aspectRatio: creativeForm.aspectRatio,
      destinationUrl: creativeForm.destinationUrl,
      weight: parseInt(creativeForm.weight) || 1,
      headline: creativeForm.headline || null,
      bodyText: creativeForm.bodyText || null,
      ctaText: creativeForm.ctaText || null,
      imageUrl: creativeForm.imageUrl || null,
      imageAlt: creativeForm.imageAlt || null,
      htmlContent: creativeForm.htmlContent || null,
    };

    const res = await fetch(`/api/admin/ads/creatives/${editCreativeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { creative?: Creative };
    if (res.ok && data.creative) {
      setCreatives((prev) =>
        prev.map((c) => (c.id === editCreativeId ? data.creative! : c))
      );
      setEditCreativeOpen(false);
      setEditCreativeId(null);
    }
    setCreativeSaving(false);
  }

  // ── Placement assignment state ────────────────────────────────────────
  const assignedIds = new Set(assignedPlacements.map((p) => p.id));

  async function togglePlacement(placementId: string, currentlyAssigned: boolean) {
    if (currentlyAssigned) {
      const res = await fetch("/api/admin/ads/campaign-placements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, placementId }),
      });
      if (res.ok) {
        setAssignedPlacements((prev) => prev.filter((p) => p.id !== placementId));
      }
    } else {
      const res = await fetch("/api/admin/ads/campaign-placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, placementId }),
      });
      const data = await res.json() as { assignment?: { id: string; weight: number } };
      if (res.ok) {
        const placement = allPlacements.find((p) => p.id === placementId);
        if (placement) {
          setAssignedPlacements((prev) => [
            ...prev,
            {
              ...placement,
              assignmentId: data.assignment?.id ?? null,
              assignmentWeight: data.assignment?.weight ?? 1,
            },
          ]);
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Campaign Info ── */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              {campaign.name}
              {statusBadge(campaign.status)}
            </CardTitle>
            <CardDescription>{campaign.advertiserName}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingCampaign((v) => !v)}
            >
              {editingCampaign ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteCampaign}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editingCampaign ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input
                    value={campaignForm.name}
                    onChange={(e) => setCampaignField("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={campaignForm.status}
                    onValueChange={(v) =>
                      setCampaignField("status", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Advertiser Name</Label>
                  <Input
                    value={campaignForm.advertiserName}
                    onChange={(e) => setCampaignField("advertiserName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Advertiser Email</Label>
                  <Input
                    type="email"
                    value={campaignForm.advertiserEmail}
                    onChange={(e) => setCampaignField("advertiserEmail", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignField("startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignField("endDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Daily Budget ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={campaignForm.dailyBudgetCents}
                    onChange={(e) => setCampaignField("dailyBudgetCents", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Budget ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={campaignForm.totalBudgetCents}
                    onChange={(e) => setCampaignField("totalBudgetCents", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={campaignForm.notes}
                  onChange={(e) => setCampaignField("notes", e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={saveCampaign} disabled={campaignSaving}>
                <Check className="h-4 w-4 mr-1" />
                {campaignSaving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Advertiser</dt>
                <dd>{campaign.advertiserName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{campaign.advertiserEmail ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Website</dt>
                <dd>
                  {campaign.advertiserUrl ? (
                    <a
                      href={campaign.advertiserUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {campaign.advertiserUrl}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Date Range</dt>
                <dd>
                  {campaign.startDate
                    ? new Date(campaign.startDate).toLocaleDateString()
                    : "—"}{" "}
                  →{" "}
                  {campaign.endDate
                    ? new Date(campaign.endDate).toLocaleDateString()
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Daily Budget</dt>
                <dd>
                  {campaign.dailyBudgetCents
                    ? `$${(campaign.dailyBudgetCents / 100).toFixed(2)}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total Budget</dt>
                <dd>
                  {campaign.totalBudgetCents
                    ? `$${(campaign.totalBudgetCents / 100).toFixed(2)}`
                    : "—"}
                </dd>
              </div>
              {campaign.notes && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="whitespace-pre-wrap">{campaign.notes}</dd>
                </div>
              )}
            </dl>
          )}
        </CardContent>
      </Card>

      {/* ── Creatives ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Creatives</CardTitle>
            <CardDescription>
              {creatives.length} creative{creatives.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Dialog open={addCreativeOpen} onOpenChange={setAddCreativeOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Creative
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Creative</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={creativeForm.name}
                    onChange={(e) => setCreativeField("name", e.target.value)}
                    placeholder="e.g. Banner v1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    value={creativeForm.creativeType}
                    onChange={(e) => setCreativeField("creativeType", e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="text">Text</option>
                    <option value="image_banner">Image Banner</option>
                    <option value="html">HTML</option>
                    <option value="native">Native</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Destination URL *</Label>
                  <Input
                    type="url"
                    value={creativeForm.destinationUrl}
                    onChange={(e) => setCreativeField("destinationUrl", e.target.value)}
                    placeholder="https://advertiser.com/landing"
                  />
                </div>
                {/* Type-specific fields */}
                {(creativeForm.creativeType === "text" || creativeForm.creativeType === "native") && (
                  <>
                    <div className="space-y-2">
                      <Label>Headline</Label>
                      <Input
                        value={creativeForm.headline}
                        onChange={(e) => setCreativeField("headline", e.target.value)}
                        placeholder="Ad headline"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Body Text</Label>
                      <Textarea
                        value={creativeForm.bodyText}
                        onChange={(e) => setCreativeField("bodyText", e.target.value)}
                        placeholder="Short description"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Text</Label>
                      <Input
                        value={creativeForm.ctaText}
                        onChange={(e) => setCreativeField("ctaText", e.target.value)}
                        placeholder="e.g. Learn More"
                      />
                    </div>
                  </>
                )}
                {creativeForm.creativeType === "image_banner" && (
                  <>
                    <div className="space-y-2">
                      <Label>Headline (optional)</Label>
                      <Input
                        value={creativeForm.headline}
                        onChange={(e) => setCreativeField("headline", e.target.value)}
                        placeholder="Ad headline"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Aspect Ratio</Label>
                      <select
                        value={creativeForm.aspectRatio}
                        onChange={(e) => setCreativeField("aspectRatio", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="auto">Auto (any slot)</option>
                        <option value="1:1">1:1 Square (sidebar)</option>
                        <option value="21:9">21:9 Ultrawide (leaderboard)</option>
                        <option value="16:9">16:9 Wide (content area)</option>
                        <option value="4:3">4:3 Landscape</option>
                        <option value="3:2">3:2 Landscape</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Controls which placements this creative can appear in. &quot;Auto&quot; allows any slot.
                      </p>
                    </div>
                  </>
                )}
                {creativeForm.creativeType === "html" && (
                  <div className="space-y-2">
                    <Label>HTML Content</Label>
                    <Textarea
                      value={creativeForm.htmlContent}
                      onChange={(e) => setCreativeField("htmlContent", e.target.value)}
                      placeholder="<div>Your ad HTML</div>"
                      rows={5}
                      className="font-mono text-xs"
                    />
                  </div>
                )}
                {(creativeForm.creativeType === "image_banner" || creativeForm.creativeType === "native") && (
                  <div className="space-y-2">
                    <Label>Image</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md cursor-pointer hover:bg-muted transition-colors">
                        {imageUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {imageUploading ? "Uploading…" : "Upload Image"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/svg+xml"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={imageUploading}
                        />
                      </label>
                      <span className="text-xs text-muted-foreground">or paste URL below</span>
                    </div>
                    <Input
                      type="url"
                      value={creativeForm.imageUrl}
                      onChange={(e) => setCreativeField("imageUrl", e.target.value)}
                      placeholder="https://cdn.example.com/image.avif"
                    />
                    {creativeForm.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={creativeForm.imageUrl}
                        alt="Preview"
                        className="mt-2 max-h-32 rounded border object-contain"
                      />
                    )}
                    <div className="space-y-2">
                      <Label>Alt Text</Label>
                      <Input
                        value={creativeForm.imageAlt}
                        onChange={(e) => setCreativeField("imageAlt", e.target.value)}
                        placeholder="Describe the image"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Weight</Label>
                  <Input
                    type="number"
                    min="1"
                    value={creativeForm.weight}
                    onChange={(e) => setCreativeField("weight", e.target.value)}
                  />
                </div>
                <Button
                  onClick={addCreative}
                  disabled={
                    creativeSaving ||
                    !creativeForm.name.trim() ||
                    !creativeForm.destinationUrl.trim()
                  }
                  className="w-full"
                >
                  {creativeSaving ? "Adding…" : "Add Creative"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {creatives.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No creatives yet. Add one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ratio</TableHead>
                  <TableHead>Headline</TableHead>
                  <TableHead className="text-right">Impr.</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creatives.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {c.creativeType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {c.aspectRatio}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {c.headline ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(creativeStats[c.id]?.impressions ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(creativeStats[c.id]?.clicks ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(() => {
                        const stats = creativeStats[c.id];
                        if (!stats || stats.impressions === 0) return "—";
                        return `${((stats.clicks / stats.impressions) * 100).toFixed(2)}%`;
                      })()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c.weight}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={(checked) =>
                          toggleCreativeActive(c.id, checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditCreative(c)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cloneCreative(c)}
                          title="Clone creative"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCreative(c.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Edit Creative Dialog ── */}
      <Dialog open={editCreativeOpen} onOpenChange={(open) => {
        setEditCreativeOpen(open);
        if (!open) setEditCreativeId(null);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Creative</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={creativeForm.name}
                onChange={(e) => setCreativeField("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={creativeForm.creativeType}
                onChange={(e) => setCreativeField("creativeType", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="text">Text</option>
                <option value="image_banner">Image Banner</option>
                <option value="html">HTML</option>
                <option value="native">Native</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Destination URL *</Label>
              <Input
                type="url"
                value={creativeForm.destinationUrl}
                onChange={(e) => setCreativeField("destinationUrl", e.target.value)}
              />
            </div>
            {(creativeForm.creativeType === "text" || creativeForm.creativeType === "native") && (
              <>
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input
                    value={creativeForm.headline}
                    onChange={(e) => setCreativeField("headline", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body Text</Label>
                  <Textarea
                    value={creativeForm.bodyText}
                    onChange={(e) => setCreativeField("bodyText", e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Text</Label>
                  <Input
                    value={creativeForm.ctaText}
                    onChange={(e) => setCreativeField("ctaText", e.target.value)}
                  />
                </div>
              </>
            )}
            {creativeForm.creativeType === "image_banner" && (
              <>
                <div className="space-y-2">
                  <Label>Headline (optional)</Label>
                  <Input
                    value={creativeForm.headline}
                    onChange={(e) => setCreativeField("headline", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <select
                    value={creativeForm.aspectRatio}
                    onChange={(e) => setCreativeField("aspectRatio", e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="auto">Auto (any slot)</option>
                    <option value="1:1">1:1 Square (sidebar)</option>
                    <option value="21:9">21:9 Ultrawide (leaderboard)</option>
                    <option value="16:9">16:9 Wide (content area)</option>
                    <option value="4:3">4:3 Landscape</option>
                    <option value="3:2">3:2 Landscape</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Controls which placements this creative can appear in.
                  </p>
                </div>
              </>
            )}
            {creativeForm.creativeType === "html" && (
              <div className="space-y-2">
                <Label>HTML Content</Label>
                <Textarea
                  value={creativeForm.htmlContent}
                  onChange={(e) => setCreativeField("htmlContent", e.target.value)}
                  rows={5}
                  className="font-mono text-xs"
                />
              </div>
            )}
            {(creativeForm.creativeType === "image_banner" || creativeForm.creativeType === "native") && (
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md cursor-pointer hover:bg-muted transition-colors">
                    {imageUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {imageUploading ? "Uploading…" : "Upload Image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/svg+xml"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={imageUploading}
                    />
                  </label>
                  <span className="text-xs text-muted-foreground">or paste URL below</span>
                </div>
                <Input
                  type="url"
                  value={creativeForm.imageUrl}
                  onChange={(e) => setCreativeField("imageUrl", e.target.value)}
                />
                {creativeForm.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={creativeForm.imageUrl}
                    alt="Preview"
                    className="mt-2 max-h-32 rounded border object-contain"
                  />
                )}
                <div className="space-y-2">
                  <Label>Alt Text</Label>
                  <Input
                    value={creativeForm.imageAlt}
                    onChange={(e) => setCreativeField("imageAlt", e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Weight</Label>
              <Input
                type="number"
                min="1"
                value={creativeForm.weight}
                onChange={(e) => setCreativeField("weight", e.target.value)}
              />
            </div>
            <Button
              onClick={saveEditCreative}
              disabled={
                creativeSaving ||
                !creativeForm.name.trim() ||
                !creativeForm.destinationUrl.trim()
              }
              className="w-full"
            >
              {creativeSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Placements ── */}
      <Card>
        <CardHeader>
          <CardTitle>Placements</CardTitle>
          <CardDescription>
            Toggle which ad slots this campaign should appear in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPlacements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No placements configured.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placement</TableHead>
                  <TableHead>Page Type</TableHead>
                  <TableHead className="text-center">Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPlacements.map((p) => {
                  const isAssigned = assignedIds.has(p.id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {p.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {p.pageType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={isAssigned}
                          onCheckedChange={(checked) =>
                            togglePlacement(p.id, !checked)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
