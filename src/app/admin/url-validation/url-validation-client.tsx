"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Wrench,
  Link2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UrlIssue {
  clinicId: string;
  title: string;
  issue: string;
  actual: string;
  expected?: string;
}

interface ValidationResult {
  total: number;
  validCount: number;
  issueCount: number;
  categories: {
    missingPrefix: number;
    formatMismatch: number;
    duplicates: number;
    emptyPermalinks: number;
    trailingSlash: number;
    invalidCharacters: number;
  };
  issues: UrlIssue[];
  samplePermalinks: string[];
}

interface FixResult {
  success: boolean;
  action: string;
  message: string;
  rowsAffected: number;
}

export function UrlValidationClient() {
  const [data, setData] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fixingAction, setFixingAction] = useState<string | null>(null);
  const [lastFixResult, setLastFixResult] = useState<FixResult | null>(null);

  const fetchValidation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/validate-urls");
      if (!response.ok) {
        throw new Error("Failed to fetch validation data");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchValidation();
  }, [fetchValidation]);

  const runFix = async (action: string) => {
    try {
      setFixingAction(action);
      setLastFixResult(null);
      const response = await fetch("/api/admin/validate-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        throw new Error("Failed to run fix");
      }
      const result = await response.json();
      setLastFixResult(result);
      // Refresh validation data after fix
      await fetchValidation();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setFixingAction(null);
    }
  };

  const getIssueBadge = (issue: string) => {
    if (issue.includes("Empty")) {
      return <Badge variant="destructive">Empty</Badge>;
    }
    if (issue.includes("Duplicate")) {
      return <Badge variant="destructive">Duplicate</Badge>;
    }
    if (issue.includes("prefix")) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">Missing Prefix</Badge>;
    }
    if (issue.includes("trailing")) {
      return <Badge variant="secondary">Trailing Slash</Badge>;
    }
    if (issue.includes("invalid")) {
      return <Badge variant="destructive">Invalid Chars</Badge>;
    }
    if (issue.includes("format")) {
      return <Badge variant="outline">Format Issue</Badge>;
    }
    return <Badge variant="secondary">{issue}</Badge>;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchValidation} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const healthPercentage = data
    ? Math.round((data.validCount / data.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Last Fix Result */}
      {lastFixResult && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{lastFixResult.message}</span>
              <Badge variant="secondary">{lastFixResult.rowsAffected} rows affected</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Clinics</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {data.total.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Valid URLs</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-green-600">
                {data.validCount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Issues Found</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-orange-600">
                {data.issueCount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">URL Health</span>
              </div>
              <div className={`text-2xl font-bold mt-2 ${
                healthPercentage >= 90 ? "text-green-600" :
                healthPercentage >= 70 ? "text-orange-600" : "text-red-600"
              }`}>
                {healthPercentage}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issue Categories & Fix Actions */}
      {data && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Issue Categories & Quick Fixes
                </CardTitle>
                <CardDescription>
                  Click a fix button to automatically resolve issues
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchValidation}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Missing Prefix */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Missing Prefix</span>
                  <Badge variant={data.categories.missingPrefix > 0 ? "destructive" : "secondary"}>
                    {data.categories.missingPrefix}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  URLs missing the &quot;pain-management/&quot; prefix
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={data.categories.missingPrefix === 0 || fixingAction !== null}
                    >
                      {fixingAction === "fix-prefix" ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wrench className="mr-2 h-4 w-4" />
                      )}
                      Fix All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Add Missing Prefixes?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will add &quot;pain-management/&quot; prefix to {data.categories.missingPrefix} permalinks.
                        This action modifies the database directly.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => runFix("fix-prefix")}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Trailing Slashes */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Trailing Slashes</span>
                  <Badge variant={data.categories.trailingSlash > 0 ? "destructive" : "secondary"}>
                    {data.categories.trailingSlash}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  URLs with trailing slashes (should be handled by middleware)
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={data.categories.trailingSlash === 0 || fixingAction !== null}
                    >
                      {fixingAction === "remove-trailing-slash" ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wrench className="mr-2 h-4 w-4" />
                      )}
                      Fix All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Trailing Slashes?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove trailing slashes from {data.categories.trailingSlash} permalinks.
                        This action modifies the database directly.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => runFix("remove-trailing-slash")}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Format Mismatch */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Format Mismatch</span>
                  <Badge variant={data.categories.formatMismatch > 0 ? "outline" : "secondary"}>
                    {data.categories.formatMismatch}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  URLs not matching expected pattern (manual review needed)
                </p>
                <Button size="sm" variant="outline" disabled>
                  Manual Review
                </Button>
              </div>

              {/* Duplicates */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Duplicates</span>
                  <Badge variant={data.categories.duplicates > 0 ? "destructive" : "secondary"}>
                    {data.categories.duplicates}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Multiple clinics sharing the same permalink
                </p>
                <Button size="sm" variant="outline" disabled>
                  Manual Review
                </Button>
              </div>

              {/* Empty Permalinks */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Empty Permalinks</span>
                  <Badge variant={data.categories.emptyPermalinks > 0 ? "destructive" : "secondary"}>
                    {data.categories.emptyPermalinks}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Clinics with no permalink set
                </p>
                <Button size="sm" variant="outline" disabled>
                  Manual Review
                </Button>
              </div>

              {/* Invalid Characters */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Invalid Characters</span>
                  <Badge variant={data.categories.invalidCharacters > 0 ? "destructive" : "secondary"}>
                    {data.categories.invalidCharacters}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  URLs with non-URL-safe characters
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={fixingAction !== null}
                    >
                      {fixingAction === "lowercase" ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wrench className="mr-2 h-4 w-4" />
                      )}
                      Lowercase All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Convert to Lowercase?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will convert all permalinks to lowercase. This can help fix
                        case-sensitivity issues but won&apos;t fix other invalid characters.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => runFix("lowercase")}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues Table */}
      {data && data.issues.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Issues Detail</CardTitle>
            </div>
            <CardDescription>
              Showing first 100 issues (sorted by severity)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Current URL</TableHead>
                  <TableHead>Expected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.issues.map((issue, index) => (
                  <TableRow key={`${issue.clinicId}-${index}`}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {issue.title}
                    </TableCell>
                    <TableCell>{getIssueBadge(issue.issue)}</TableCell>
                    <TableCell className="font-mono text-sm max-w-[250px] truncate text-muted-foreground">
                      {issue.actual}
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-[250px] truncate text-green-600">
                      {issue.expected || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sample Permalinks */}
      {data && data.samplePermalinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sample Permalinks</CardTitle>
            <CardDescription>
              First 10 permalinks in the database for reference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.samplePermalinks.map((permalink, i) => (
                <div key={i} className="font-mono text-sm text-muted-foreground">
                  /{permalink}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
