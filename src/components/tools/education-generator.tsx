"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import {
  educationCategories,
  contentFormats,
  type ContentFormat,
} from "@/data/education-conditions";
import { EducationOutput } from "./education-output";
import { SignInGate } from "./sign-in-gate";
import { useSession } from "@/lib/auth-client";

const FREE_GENERATION_LIMIT = 5;

interface EducationGeneratorProps {
  defaultCategory?: string;
}

export function EducationGenerator({ defaultCategory }: EducationGeneratorProps) {
  const { data: session } = useSession();
  const [selectedCondition, setSelectedCondition] = useState("");
  const [format, setFormat] = useState<ContentFormat>("website");
  const [clinicName, setClinicName] = useState("");
  const [clinicLocation, setClinicLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    content: string;
    condition: string;
    format: ContentFormat;
  } | null>(null);
  const [error, setError] = useState("");
  const [showSignInGate, setShowSignInGate] = useState(false);
  const [remainingRuns, setRemainingRuns] = useState<number | null>(null);
  const generatorRef = useRef<HTMLDivElement>(null);

  // Find the selected condition name for display
  const getConditionName = useCallback((slug: string): string => {
    for (const cat of educationCategories) {
      const cond = cat.conditions.find((c) => c.slug === slug);
      if (cond) return cond.name;
    }
    return slug;
  }, []);

  async function handleGenerate() {
    if (!selectedCondition) {
      setError("Please select a condition");
      return;
    }

    // Require sign-in
    if (!session?.user) {
      setShowSignInGate(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tools/generate-education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: getConditionName(selectedCondition),
          format,
          clinicName: clinicName || undefined,
          clinicLocation: clinicLocation || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate content");
      }

      const data = await res.json();
      setResult({
        content: data.content,
        condition: getConditionName(selectedCondition),
        format,
      });
      if (typeof data.remaining === "number") {
        setRemainingRuns(data.remaining);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Determine which categories to show. If defaultCategory, show it first/expanded
  const sortedCategories = defaultCategory
    ? [
        ...educationCategories.filter((c) => c.slug === defaultCategory),
        ...educationCategories.filter((c) => c.slug !== defaultCategory),
      ]
    : educationCategories;

  function handleConditionClick(slug: string) {
    setSelectedCondition(slug);
    generatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Get the conditions to display as tiles (from defaultCategory or all)
  const tileCategory = defaultCategory
    ? educationCategories.find((c) => c.slug === defaultCategory)
    : null;
  const tileConditions = tileCategory ? tileCategory.conditions : null;

  return (
    <div className="space-y-8">
      {/* Condition Quick-Pick Tiles */}
      {tileConditions && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Pick a condition to get started
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select any condition below and we&apos;ll generate ready-to-use content for your clinic website, patient handouts, or social media.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tileConditions.map((condition) => (
              <button
                key={condition.slug}
                type="button"
                onClick={() => handleConditionClick(condition.slug)}
                className={`text-left rounded-lg border p-4 transition-all hover:shadow-sm ${
                  selectedCondition === condition.slug
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-500"
                    : "border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm text-foreground">
                    {condition.name}
                  </h3>
                  <ArrowRight className={`h-4 w-4 flex-shrink-0 transition-colors ${
                    selectedCondition === condition.slug
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  }`} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {condition.shortDescription}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <Card ref={generatorRef}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            Generate Patient Education Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Condition Selector */}
          <div className="space-y-2">
            <Label htmlFor="condition">Condition / Procedure</Label>
            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger id="condition">
                <SelectValue placeholder="Select a condition..." />
              </SelectTrigger>
              <SelectContent>
                {sortedCategories.map((category) => (
                  <SelectGroup key={category.slug}>
                    <SelectLabel>{category.name}</SelectLabel>
                    {category.conditions.map((condition) => (
                      <SelectItem key={condition.slug} value={condition.slug}>
                        {condition.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Format */}
          <div className="space-y-3">
            <Label>Content Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as ContentFormat)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {contentFormats.map((f) => (
                <Label
                  key={f.value}
                  htmlFor={`format-${f.value}`}
                  className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 has-[*[data-state=checked]]:border-emerald-500 has-[*[data-state=checked]]:bg-emerald-50 dark:has-[*[data-state=checked]]:bg-emerald-950/20"
                >
                  <RadioGroupItem value={f.value} id={`format-${f.value}`} className="mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">{f.label}</div>
                    <div className="text-xs text-muted-foreground">{f.description}</div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Optional Personalization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clinic-name">Clinic Name (optional)</Label>
              <Input
                id="clinic-name"
                placeholder="e.g., Summit Pain Care"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic-location">City, State (optional)</Label>
              <Input
                id="clinic-location"
                placeholder="e.g., Phoenix, AZ"
                value={clinicLocation}
                onChange={(e) => setClinicLocation(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading || !selectedCondition}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : !session?.user ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Sign In to Generate
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>

          {session?.user && remainingRuns !== null && remainingRuns > 0 && (
            <p className="text-xs text-muted-foreground">
              {remainingRuns} free {remainingRuns === 1 ? "generation" : "generations"} remaining
            </p>
          )}
          {!session?.user && (
            <p className="text-xs text-muted-foreground">
              Sign in to get {FREE_GENERATION_LIMIT} free AI generations — no credit card required
            </p>
          )}
        </CardContent>
      </Card>

      {/* Output */}
      {result && (
        <EducationOutput
          content={result.content}
          condition={result.condition}
          format={result.format}
        />
      )}

      {/* Sign-In Gate Modal */}
      <SignInGate
        open={showSignInGate}
        onOpenChange={setShowSignInGate}
      />
    </div>
  );
}
