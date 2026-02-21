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
import { getPlacementsWithCounts } from "@/lib/ad-stats-queries";
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
                  <TableHead className="text-right">Campaigns</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placements.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.name}</TableCell>
                    <TableCell className="font-medium">{p.label}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {p.pageType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.defaultWidth && p.defaultHeight
                        ? `${p.defaultWidth}×${p.defaultHeight}`
                        : "—"}
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
