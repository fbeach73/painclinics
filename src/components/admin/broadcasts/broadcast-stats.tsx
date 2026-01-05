"use client";

import {
  Users,
  Send,
  CheckCircle,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BroadcastStatsProps {
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  status: string;
  // These come from email logs
  deliveredCount?: number;
  openedCount?: number;
  clickedCount?: number;
  bouncedCount?: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  rate?: number | undefined;
  colorClass?: string | undefined;
}

function StatCard({ label, value, icon, rate, colorClass = "text-muted-foreground" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
            {rate !== undefined && (
              <p className="text-xs text-muted-foreground">
                {rate.toFixed(1)}% rate
              </p>
            )}
          </div>
          <div className={`p-2 rounded-full bg-muted ${colorClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BroadcastStats({
  recipientCount,
  sentCount,
  failedCount,
  status,
  deliveredCount = 0,
  openedCount = 0,
  clickedCount = 0,
  bouncedCount = 0,
}: BroadcastStatsProps) {
  // Calculate rates
  const deliveryRate = sentCount > 0 ? (deliveredCount / sentCount) * 100 : 0;
  const openRate = deliveredCount > 0 ? (openedCount / deliveredCount) * 100 : 0;
  const clickRate = openedCount > 0 ? (clickedCount / openedCount) * 100 : 0;
  // Failure rate includes both failed sends and bounced emails
  const totalFailed = failedCount + bouncedCount;
  const failureRate = sentCount > 0 ? (totalFailed / sentCount) * 100 : 0;

  const isSending = status === "sending";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        label="Recipients"
        value={recipientCount}
        icon={<Users className="h-5 w-5" />}
        colorClass="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        label={isSending ? "Sending" : "Sent"}
        value={sentCount}
        icon={isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        colorClass="text-indigo-600 dark:text-indigo-400"
      />
      <StatCard
        label="Delivered"
        value={deliveredCount}
        rate={sentCount > 0 ? deliveryRate : undefined}
        icon={<CheckCircle className="h-5 w-5" />}
        colorClass="text-green-600 dark:text-green-400"
      />
      <StatCard
        label="Opened"
        value={openedCount}
        rate={deliveredCount > 0 ? openRate : undefined}
        icon={<Eye className="h-5 w-5" />}
        colorClass="text-featured-foreground"
      />
      <StatCard
        label="Clicked"
        value={clickedCount}
        rate={openedCount > 0 ? clickRate : undefined}
        icon={<MousePointerClick className="h-5 w-5" />}
        colorClass="text-purple-600 dark:text-purple-400"
      />
      <StatCard
        label="Failed"
        value={totalFailed}
        rate={sentCount > 0 ? failureRate : undefined}
        icon={<AlertTriangle className="h-5 w-5" />}
        colorClass="text-red-600 dark:text-red-400"
      />
    </div>
  );
}
