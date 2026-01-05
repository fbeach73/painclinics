import Link from "next/link";
import { Building2, Edit, Eye, MapPin, Star, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/session";
import { getOwnedClinics } from "@/lib/owner-queries";

export default async function DashboardPage() {
  const session = await requireAuth();

  // Fetch user's owned clinics
  const clinics = await getOwnedClinics(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name?.split(" ")[0] || "there"}!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Name:</span>{" "}
                {session.user.name}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                {session.user.email}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{clinics.length}</div>
                <div className="text-xs text-muted-foreground">Clinics</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">
                  {clinics.filter((c) => c.isFeatured).length}
                </div>
                <div className="text-xs text-muted-foreground">Featured</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Clinics Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            My Clinics
          </CardTitle>
          {clinics.length > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/my-clinics">View All</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {clinics.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No clinics yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                You haven&apos;t claimed any clinic listings yet.
              </p>
              <Button asChild>
                <Link href="/pain-management">Find Your Clinic</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {clinics.slice(0, 5).map((clinic) => (
                <div
                  key={clinic.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{clinic.title}</h3>
                      {clinic.isFeatured && (
                        <Badge
                          variant="secondary"
                          className="bg-featured text-featured-foreground border-featured-border shrink-0"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          {clinic.featuredTier === "premium"
                            ? "Premium"
                            : "Featured"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {clinic.city}, {clinic.stateAbbreviation || clinic.state}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${clinic.permalink}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/my-clinics/${clinic.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Manage
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {clinics.length > 5 && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  And {clinics.length - 5} more...{" "}
                  <Link href="/my-clinics" className="text-primary hover:underline">
                    View all
                  </Link>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
