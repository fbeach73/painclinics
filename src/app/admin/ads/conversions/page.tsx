import { getRecentConversions } from "@/lib/ad-stats-queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ConversionsPage() {
  const conversions = await getRecentConversions(100);

  function formatDate(d: Date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(d));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conversions</h1>
        <p className="text-muted-foreground">
          Recent conversion events and payout log
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Log</CardTitle>
          <CardDescription>
            Last {conversions.length} conversion{conversions.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversions.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">
              No conversions recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Click ID</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Creative</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Payout</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversions.map((cv) => (
                  <TableRow key={cv.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                      {cv.clickId}
                    </TableCell>
                    <TableCell className="font-medium">
                      {cv.campaignName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cv.creativeName}
                    </TableCell>
                    <TableCell>
                      {cv.conversionType ? (
                        <Badge variant="outline" className="text-xs capitalize">
                          {cv.conversionType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {cv.payout ? (
                        <span className="font-medium text-green-700 dark:text-green-400">
                          ${parseFloat(cv.payout).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(cv.createdAt)}
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
