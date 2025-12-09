import Link from "next/link";
import { Database, Star, Edit, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClinicsForAdmin, getClinicCount } from "@/lib/clinic-queries";

export default async function ClinicsPage() {
  const [clinics, totalCount] = await Promise.all([
    getClinicsForAdmin(100, 0),
    getClinicCount(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clinics</h1>
          <p className="text-muted-foreground">
            Manage clinic data and services
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {totalCount.toLocaleString()} total clinics
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Clinic Database</CardTitle>
          </div>
          <CardDescription>
            Click on a clinic to manage its services and view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clinics.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No clinics found. Use the Data Import section to import clinic data.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">Reviews</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinics.map((clinic) => (
                    <TableRow key={clinic.id}>
                      <TableCell>
                        <Link
                          href={`/admin/clinics/${clinic.id}`}
                          className="font-medium hover:underline"
                        >
                          {clinic.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {clinic.city}, {clinic.stateAbbreviation}
                      </TableCell>
                      <TableCell className="text-center">
                        {clinic.rating ? (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                            <span>{clinic.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {clinic.reviewCount ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/clinics/${clinic.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {totalCount > 100 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing first 100 of {totalCount.toLocaleString()} clinics
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
