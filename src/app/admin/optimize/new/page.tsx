"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewBatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [batchSize, setBatchSize] = useState(50);
  const [reviewFrequency, setReviewFrequency] = useState(250);
  const [targetWordCount, setTargetWordCount] = useState(400);
  const [faqCount, setFaqCount] = useState(4);
  const [includeKeywords, setIncludeKeywords] = useState(true);
  const [generateFaq, setGenerateFaq] = useState(true);
  const [excludeOptimized, setExcludeOptimized] = useState(true);
  const [minReviewCount, setMinReviewCount] = useState(0);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          clinicFilters: {
            states: selectedStates.length > 0 ? selectedStates : undefined,
            minReviewCount: minReviewCount > 0 ? minReviewCount : undefined,
            excludeOptimized,
          },
          options: {
            batchSize,
            reviewFrequency,
            targetWordCount,
            includeKeywords,
            generateFaq,
            faqCount,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create batch");
      }

      const data = await response.json();
      router.push(`/admin/optimize/${data.batch.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Estimated cost calculation
  const estimatedCostPerClinic = 0.015;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link
        href="/admin/optimize"
        className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          Create Optimization Batch
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure a new batch to optimize clinic content
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Batch Settings</CardTitle>
            <CardDescription>
              Configure how the batch will be processed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Batch Name (optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Initial optimization run"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchSize">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  min={10}
                  max={100}
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Clinics processed per batch (10-100)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewFrequency">Review Frequency</Label>
                <Input
                  id="reviewFrequency"
                  type="number"
                  min={50}
                  max={1000}
                  value={reviewFrequency}
                  onChange={(e) => setReviewFrequency(parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Pause for review every N clinics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Content Settings</CardTitle>
            <CardDescription>
              Configure how content will be optimized
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetWordCount">Target Word Count</Label>
                <Input
                  id="targetWordCount"
                  type="number"
                  min={200}
                  max={600}
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Ideal content length (200-600 words)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="faqCount">FAQ Questions</Label>
                <Input
                  id="faqCount"
                  type="number"
                  min={0}
                  max={10}
                  value={faqCount}
                  onChange={(e) => setFaqCount(parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Number of FAQs to generate
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeKeywords"
                  checked={includeKeywords}
                  onCheckedChange={(checked) =>
                    setIncludeKeywords(checked as boolean)
                  }
                />
                <Label htmlFor="includeKeywords" className="text-sm">
                  Integrate review keywords into content
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generateFaq"
                  checked={generateFaq}
                  onCheckedChange={(checked) =>
                    setGenerateFaq(checked as boolean)
                  }
                />
                <Label htmlFor="generateFaq" className="text-sm">
                  Generate FAQ sections
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Clinic Filters</CardTitle>
            <CardDescription>
              Select which clinics to include in this batch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="excludeOptimized"
                checked={excludeOptimized}
                onCheckedChange={(checked) =>
                  setExcludeOptimized(checked as boolean)
                }
              />
              <Label htmlFor="excludeOptimized" className="text-sm">
                Exclude already optimized clinics
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minReviewCount">Minimum Review Count</Label>
              <Input
                id="minReviewCount"
                type="number"
                min={0}
                value={minReviewCount}
                onChange={(e) => setMinReviewCount(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Only include clinics with at least this many reviews (0 = no
                minimum)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Filter by State (optional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Leave empty to include all states. Enter state names separated
                by commas.
              </p>
              <Input
                placeholder="e.g., California, Texas, New York"
                onChange={(e) => {
                  const states = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
                  setSelectedStates(states);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cost Estimate */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estimated Cost</p>
                <p className="text-xs text-muted-foreground">
                  ~${estimatedCostPerClinic.toFixed(3)} per clinic using Claude
                  Sonnet 4
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold flex items-center">
                  <DollarSign className="h-5 w-5" />
                  <span>TBD</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Calculated after creation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Link href="/admin/optimize">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Batch
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
