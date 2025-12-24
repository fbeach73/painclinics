"use client";

import { TrendingUp, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeywordsAnalyticsClient } from "./keywords-client";
import { TrafficAnalyticsClient } from "./traffic-analytics-client";

export function AnalyticsPageClient() {
  return (
    <Tabs defaultValue="traffic" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="traffic" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Traffic
        </TabsTrigger>
        <TabsTrigger value="reviews" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Review Keywords
        </TabsTrigger>
      </TabsList>

      <TabsContent value="traffic" className="mt-0">
        <TrafficAnalyticsClient />
      </TabsContent>

      <TabsContent value="reviews" className="mt-0">
        <KeywordsAnalyticsClient />
      </TabsContent>
    </Tabs>
  );
}
