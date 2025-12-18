"use client";

import { useState, useCallback } from "react";
import { Search, Eye, PlayCircle, CheckCircle2, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MigrationPreview } from "./migration-preview";
import { MigrationProgress, type MigrationStats } from "./migration-progress";
import { MigrationResults } from "./migration-results";

type WizardStep = "discover" | "preview" | "execute" | "results";

interface StepConfig {
  id: WizardStep;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: StepConfig[] = [
  {
    id: "discover",
    title: "Discover",
    description: "Scan WordPress sitemaps",
    icon: <Search className="h-5 w-5" />,
  },
  {
    id: "preview",
    title: "Preview",
    description: "Review content to import",
    icon: <Eye className="h-5 w-5" />,
  },
  {
    id: "execute",
    title: "Execute",
    description: "Run migration",
    icon: <PlayCircle className="h-5 w-5" />,
  },
  {
    id: "results",
    title: "Results",
    description: "View summary",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
];

interface SitemapData {
  sitemaps: Array<{ url: string; postCount: number }>;
  totalUrlsFound: number;
  blogPostCount: number;
  postUrls: string[];
}

export function MigrationWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>("discover");
  const [sitemapData, setSitemapData] = useState<SitemapData | null>(null);
  const [migrationResults, setMigrationResults] = useState<MigrationStats | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiscover = async () => {
    setIsDiscovering(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/blog/migration/sitemaps");
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to discover sitemaps");
      }

      setSitemapData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handlePreviewClick = async () => {
    setCurrentStep("preview");
  };

  const handleStartMigration = () => {
    setCurrentStep("execute");
  };

  const handleMigrationComplete = useCallback((stats: MigrationStats) => {
    setMigrationResults(stats);
    setCurrentStep("results");
  }, []);

  const handleReset = () => {
    setCurrentStep("discover");
    setSitemapData(null);
    setMigrationResults(null);
    setError(null);
  };

  const handleBack = () => {
    if (currentStep === "preview") {
      setCurrentStep("discover");
    } else if (currentStep === "execute") {
      setCurrentStep("preview");
    }
  };

  const getCurrentStepIndex = () => {
    return steps.findIndex((s) => s.id === currentStep);
  };

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
        {steps.map((step, index) => {
          const currentIndex = getCurrentStepIndex();
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;
          const isDisabled = index > currentIndex;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "text-primary",
                  isDisabled && "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2",
                    isActive && "border-primary-foreground bg-primary-foreground/20",
                    isCompleted && "border-primary bg-primary/10",
                    isDisabled && "border-muted-foreground/30"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className={cn(
                    "text-xs",
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="h-5 w-5 text-muted-foreground mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Back button */}
      {(currentStep === "preview" || currentStep === "execute") && (
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      {/* Step content */}
      {currentStep === "discover" && (
        <DiscoverStep
          sitemapData={sitemapData}
          isDiscovering={isDiscovering}
          error={error}
          onDiscover={handleDiscover}
          onNext={handlePreviewClick}
        />
      )}

      {currentStep === "preview" && (
        <MigrationPreview
          onStartMigration={handleStartMigration}
        />
      )}

      {currentStep === "execute" && (
        <MigrationProgress
          skipExisting={true}
          migrateImages={true}
          onComplete={handleMigrationComplete}
        />
      )}

      {currentStep === "results" && migrationResults && (
        <MigrationResults
          stats={migrationResults}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

interface DiscoverStepProps {
  sitemapData: SitemapData | null;
  isDiscovering: boolean;
  error: string | null;
  onDiscover: () => void;
  onNext: () => void;
}

function DiscoverStep({
  sitemapData,
  isDiscovering,
  error,
  onDiscover,
  onNext,
}: DiscoverStepProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Discovery Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            WordPress Discovery
          </CardTitle>
          <CardDescription>
            Scan painclinics.com sitemaps to find all blog posts available for import
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={onDiscover}
            disabled={isDiscovering}
            className="w-full"
          >
            {isDiscovering ? (
              <>
                <Search className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Scan Sitemaps
              </>
            )}
          </Button>

          {sitemapData && (
            <div className="space-y-3 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{sitemapData.sitemaps.length}</p>
                  <p className="text-xs text-muted-foreground">Sitemaps Found</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{sitemapData.blogPostCount}</p>
                  <p className="text-xs text-muted-foreground">Blog Posts</p>
                </div>
              </div>

              {sitemapData.sitemaps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Discovered Sitemaps:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {sitemapData.sitemaps.map((sitemap) => (
                      <li key={sitemap.url} className="flex justify-between">
                        <span className="truncate max-w-[200px]">{sitemap.url.split("/").pop()}</span>
                        <span className="text-primary">{sitemap.postCount} URLs</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Overview</CardTitle>
          <CardDescription>
            What happens during the migration process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Categories & Tags</p>
                <p className="text-muted-foreground">
                  Import all WordPress categories and tags, preserving hierarchy
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Blog Posts</p>
                <p className="text-muted-foreground">
                  Import all published posts with content, excerpts, and metadata
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Image Migration</p>
                <p className="text-muted-foreground">
                  Download images from WordPress and upload to Vercel Blob storage
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">URL Redirects</p>
                <p className="text-muted-foreground">
                  Generate redirect config for old URLs to new blog paths
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Next Button */}
      {sitemapData && sitemapData.blogPostCount > 0 && (
        <div className="lg:col-span-2">
          <Button onClick={onNext} className="w-full" size="lg">
            Continue to Preview
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
