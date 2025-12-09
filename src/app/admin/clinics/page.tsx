import { Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClinicsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Clinics Management</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Clinic Database</CardTitle>
          </div>
          <CardDescription>
            View and manage imported clinic data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Clinic management features coming soon. Use the Data Import section to import clinic data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
