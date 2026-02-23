import { Info } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPlacementsWithCounts } from "@/lib/ad-stats-queries";
import { PLACEMENT_SPECS, getAdsenseSlotId } from "@/lib/ad-placement-specs";
import { PlacementsClient } from "./placements-client";
import { PlacementToggleClient } from "./placement-toggle-client";

export default async function PlacementsPage() {
  const placements = await getPlacementsWithCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Placements</h1>
        <p className="text-muted-foreground">
          Configure ad slots and manage the global ad server traffic split
        </p>
      </div>

      {/* Global percentage slider */}
      <PlacementsClient />

      <Card>
        <CardHeader>
          <CardTitle>All Placements</CardTitle>
          <CardDescription>
            {placements.length} placement{placements.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {placements.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">
              No placements seeded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Page Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>AdSense Slot</TableHead>
                  <TableHead className="text-right">Campaigns</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placements.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{p.label}</span>
                        {PLACEMENT_SPECS[p.name] && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs text-xs">
                                <p>{PLACEMENT_SPECS[p.name]!.note}</p>
                                {PLACEMENT_SPECS[p.name]!.allowedTypes && (
                                  <p className="mt-1 text-muted-foreground">
                                    Types: {PLACEMENT_SPECS[p.name]!.allowedTypes!.join(", ")}
                                  </p>
                                )}
                                {PLACEMENT_SPECS[p.name]!.allowedRatios && (
                                  <p className="text-muted-foreground">
                                    Ratios: {PLACEMENT_SPECS[p.name]!.allowedRatios!.join(", ")}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {p.pageType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.defaultWidth && p.defaultHeight
                        ? `${p.defaultWidth}×${p.defaultHeight}`
                        : "Responsive"}
                    </TableCell>
                    <TableCell>
                      {PLACEMENT_SPECS[p.name]?.hostedOnly ? (
                        <span className="text-xs text-muted-foreground">Hosted only</span>
                      ) : (
                        <code className="text-xs font-mono text-muted-foreground">{getAdsenseSlotId(p.name)}</code>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.assignedCampaignCount}
                    </TableCell>
                    <TableCell className="text-center">
                      <PlacementToggleClient id={p.id} isActive={p.isActive} />
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
