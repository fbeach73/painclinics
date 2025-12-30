import Link from "next/link";
import { Building2, Edit, Eye, MapPin, Phone, Star, Image as ImageIcon, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionStatusBadge } from "@/components/owner/subscription-status-badge";
import { getOwnedClinics, getOwnerClinicStats } from "@/lib/owner-queries";
import { requireOwner } from "@/lib/session";

export default async function MyClinicsPage() {
  const session = await requireOwner();
  const [clinics, stats] = await Promise.all([
    getOwnedClinics(session.user.id),
    getOwnerClinicStats(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Clinics</h1>
        <p className="text-muted-foreground">
          Manage your claimed clinic listings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClinics}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.featuredCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.premiumCount} premium
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating || "N/A"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
          </CardContent>
        </Card>
      </div>

      {/* Clinics List */}
      {clinics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clinics yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven&apos;t claimed any clinic listings yet.
              <br />
              Search for your clinic and claim it to get started.
            </p>
            <Button asChild>
              <Link href="/pain-management">Find Your Clinic</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clinics.map((clinic) => (
            <Card key={clinic.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{clinic.title}</h3>
                      {clinic.isFeatured && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          <Star className="h-3 w-3 mr-1" />
                          {clinic.featuredTier === "premium" ? "Premium" : "Featured"}
                        </Badge>
                      )}
                      {clinic.isVerified && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {clinic.city}, {clinic.stateAbbreviation || clinic.state}
                      </span>
                      {clinic.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {clinic.phone}
                        </span>
                      )}
                    </div>
                    {clinic.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>{clinic.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({clinic.reviewCount} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${clinic.permalink}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
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

                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/my-clinics/${clinic.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Info
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/my-clinics/${clinic.id}/photos`}>
                      <ImageIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                      Photos
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/my-clinics/${clinic.id}/services`}>
                      <Wrench className="h-4 w-4 mr-1" />
                      Services
                    </Link>
                  </Button>
                  {clinic.featuredSubscription?.status === "active" && clinic.featuredSubscription.tier ? (
                    <SubscriptionStatusBadge
                      tier={clinic.featuredSubscription.tier as "basic" | "premium"}
                      clinicId={clinic.id}
                    />
                  ) : (
                    <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" asChild>
                      <Link href={`/my-clinics/${clinic.id}/featured`}>
                        <Star className="h-4 w-4 mr-1" />
                        Get Featured
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
