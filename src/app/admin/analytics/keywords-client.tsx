"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Users,
  Hash,
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

interface KeywordAggregation {
  keyword: string;
  totalCount: number;
  clinicCount: number;
  avgPerClinic: number;
  sentiment: "positive" | "neutral" | "negative";
}

interface KeywordsResponse {
  keywords: KeywordAggregation[];
  summary: {
    totalKeywords: number;
    clinicsAnalyzed: number;
    sentiment: { positive: number; neutral: number; negative: number };
  };
  filters: {
    state: string | null;
    city: string | null;
    limit: number;
  };
}

// US State abbreviations for the filter dropdown
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export function KeywordsAnalyticsClient() {
  const [data, setData] = useState<KeywordsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string>("all");

  const fetchKeywords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (stateFilter && stateFilter !== "all") {
        params.set("state", stateFilter);
      }
      params.set("limit", "50");

      const response = await fetch(`/api/admin/analytics/keywords?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch keywords data");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [stateFilter]);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const getSentimentBadge = (sentiment: "positive" | "neutral" | "negative") => {
    switch (sentiment) {
      case "positive":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <TrendingUp className="mr-1 h-3 w-3" />
            Positive
          </Badge>
        );
      case "negative":
        return (
          <Badge variant="destructive">
            <TrendingDown className="mr-1 h-3 w-3" />
            Negative
          </Badge>
        );
      case "neutral":
      default:
        return (
          <Badge variant="secondary">
            <Minus className="mr-1 h-3 w-3" />
            Neutral
          </Badge>
        );
    }
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
          <Button onClick={fetchKeywords} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">State:</label>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchKeywords}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Unique Keywords</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {data.summary.totalKeywords.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Clinics Analyzed</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {data.summary.clinicsAnalyzed.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Positive</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-green-600">
                {data.summary.sentiment.positive}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Neutral</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {data.summary.sentiment.neutral}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Negative</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-red-600">
                {data.summary.sentiment.negative}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Keywords Table */}
      {data && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle>Top 50 Keywords</CardTitle>
            </div>
            <CardDescription>
              Most frequent keywords from clinic reviews
              {stateFilter !== "all" && ` in ${stateFilter}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.keywords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No keyword data available</p>
                <p className="text-sm">
                  {stateFilter !== "all"
                    ? "Try selecting a different state or all states"
                    : "Import clinics with review data to see analytics"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Keyword</TableHead>
                    <TableHead className="text-right">Total Mentions</TableHead>
                    <TableHead className="text-right">Clinics</TableHead>
                    <TableHead className="text-right">Avg/Clinic</TableHead>
                    <TableHead>Sentiment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.keywords.map((kw, index) => (
                    <TableRow key={kw.keyword}>
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{kw.keyword}</TableCell>
                      <TableCell className="text-right">
                        {kw.totalCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {kw.clinicCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{kw.avgPerClinic}</TableCell>
                      <TableCell>{getSentimentBadge(kw.sentiment)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
