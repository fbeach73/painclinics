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
  getRotationHistory,
  getCurrentRotationBatch,
} from "@/lib/rotation/featured-rotation";
import { RotateNowButton } from "./rotation-actions";

export const metadata = {
  title: "Featured Rotation - Admin",
  description: "Manage featured clinic rotation batches",
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function RotationPage() {
  const [currentBatch, history] = await Promise.all([
    getCurrentRotationBatch(),
    getRotationHistory(),
  ]);

  const uniqueStates = new Set(currentBatch.map((c) => c.clinicState));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Featured Rotation
          </h1>
          <p className="text-muted-foreground">
            Rotate featured clinics weekly to prospect clinic owners
          </p>
        </div>
      </div>

      {/* Current Batch */}
      <Card>
        <CardHeader>
          <CardTitle>Current Rotation Batch</CardTitle>
          <CardDescription>
            {currentBatch.length > 0
              ? `${currentBatch.length} clinics across ${uniqueStates.size} states — featured ${formatDate(currentBatch[0]?.featuredAt ?? null)}`
              : "No active rotation batch"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RotateNowButton />

          {currentBatch.length > 0 && (
            <div className="max-h-96 overflow-auto rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentBatch.map((clinic) => (
                    <TableRow key={clinic.clinicId}>
                      <TableCell className="font-medium">
                        {clinic.clinicTitle}
                      </TableCell>
                      <TableCell>{clinic.clinicCity ?? "—"}</TableCell>
                      <TableCell>{clinic.clinicState ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rotation History */}
      <Card>
        <CardHeader>
          <CardTitle>Rotation History</CardTitle>
          <CardDescription>
            Previous rotation batches and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rotation history yet. Click &quot;Rotate Now&quot; to start.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Unfeatured</TableHead>
                  <TableHead>Clinics</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((batch) => (
                  <TableRow key={batch.batchId}>
                    <TableCell className="font-mono text-xs">
                      {batch.batchId.slice(0, 8)}
                    </TableCell>
                    <TableCell>{formatDate(batch.featuredAt)}</TableCell>
                    <TableCell>{formatDate(batch.unfeaturedAt)}</TableCell>
                    <TableCell>{batch.clinicCount}</TableCell>
                    <TableCell>
                      {batch.broadcastId ? (
                        <Badge variant="default">Sent</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
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
