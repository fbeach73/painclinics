import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { adCampaigns } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

async function getCampaigns() {
  return db
    .select({
      id: adCampaigns.id,
      name: adCampaigns.name,
      advertiserName: adCampaigns.advertiserName,
      status: adCampaigns.status,
      startDate: adCampaigns.startDate,
      endDate: adCampaigns.endDate,
      createdAt: adCampaigns.createdAt,
      impressionCount: sql<number>`
        COALESCE((
          SELECT COUNT(*)::int
          FROM ad_impressions
          WHERE ad_impressions.campaign_id = ad_campaigns.id
        ), 0)
      `,
      clickCount: sql<number>`
        COALESCE((
          SELECT COUNT(*)::int
          FROM ad_impressions i
          INNER JOIN ad_clicks k ON k.click_id = i.click_id
          WHERE i.campaign_id = ad_campaigns.id
        ), 0)
      `,
    })
    .from(adCampaigns)
    .orderBy(sql`${adCampaigns.createdAt} DESC`);
}

function statusBadge(status: "active" | "paused" | "ended") {
  if (status === "active")
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">Active</Badge>;
  if (status === "paused")
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0">Paused</Badge>;
  return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0">Ended</Badge>;
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage ad campaigns and their creatives
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/ads/campaigns/new">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No campaigns yet.{" "}
              <Link
                href="/admin/ads/campaigns/new"
                className="underline text-foreground"
              >
                Create one.
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Advertiser</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.advertiserName}
                    </TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.startDate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.endDate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.impressionCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.clickCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/ads/campaigns/${c.id}`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
