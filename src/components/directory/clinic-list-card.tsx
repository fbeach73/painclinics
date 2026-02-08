import Link from "next/link";
import { MapPin, Phone, Star, Shield } from "lucide-react";
import { FeaturedBadge, type FeaturedTier } from "@/components/clinic/featured-badge";
import { OpenClosedStatus } from "@/components/clinic/open-closed-status";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClinicListItem } from "@/lib/directory/queries";

interface ClinicListCardProps {
  clinic: ClinicListItem;
}

export function ClinicListCard({ clinic }: ClinicListCardProps) {
  const featuredTier: FeaturedTier =
    clinic.isFeatured && clinic.featuredTier
      ? (clinic.featuredTier as FeaturedTier)
      : "none";

  const services = clinic.serviceNames?.split(", ").slice(0, 4) ?? [];

  return (
    <Link
      href={`/${clinic.permalink}/`}
      className={cn(
        "block p-4 sm:p-5 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
        featuredTier === "premium" &&
          "border-featured-border bg-featured ring-1 ring-featured-border/50",
        featuredTier === "basic" &&
          "border-yellow-200 bg-yellow-50/20 dark:border-yellow-800/50 dark:bg-yellow-950/10"
      )}
      itemScope
      itemType="https://schema.org/MedicalBusiness"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top row: badges + name */}
          <div className="flex items-start gap-2 mb-1.5">
            <FeaturedBadge
              tier={featuredTier}
              size="sm"
              className="flex-shrink-0"
            />
            {clinic.isVerified && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs flex-shrink-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50"
              >
                <Shield className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-base sm:text-lg mb-1" itemProp="name">
            {clinic.title}
          </h3>

          {/* Rating + reviews */}
          {clinic.rating !== null && clinic.rating > 0 && (
            <div
              className="flex items-center gap-1.5 mb-2"
              itemProp="aggregateRating"
              itemScope
              itemType="https://schema.org/AggregateRating"
            >
              <div className="flex items-center gap-0.5">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold" itemProp="ratingValue">
                  {clinic.rating.toFixed(1)}
                </span>
              </div>
              {clinic.reviewCount !== null && clinic.reviewCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  (<span itemProp="reviewCount">{clinic.reviewCount}</span>{" "}
                  review{clinic.reviewCount !== 1 ? "s" : ""})
                </span>
              )}
              <meta itemProp="bestRating" content="5" />
              <meta itemProp="worstRating" content="1" />
            </div>
          )}

          {/* Address */}
          <address
            className="not-italic text-sm text-muted-foreground mb-2 flex items-start gap-1.5"
            itemProp="address"
            itemScope
            itemType="https://schema.org/PostalAddress"
          >
            <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>
              {clinic.streetAddress && (
                <>
                  <span itemProp="streetAddress">{clinic.streetAddress}</span>
                  {", "}
                </>
              )}
              <span itemProp="addressLocality">{clinic.city}</span>,{" "}
              <span itemProp="addressRegion">{clinic.stateAbbreviation}</span>{" "}
              <span itemProp="postalCode">{clinic.postalCode}</span>
            </span>
          </address>

          {/* Services */}
          {services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {services.map((service) => (
                <Badge
                  key={service}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {service}
                </Badge>
              ))}
              {clinic.serviceNames &&
                clinic.serviceNames.split(", ").length > 4 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{clinic.serviceNames.split(", ").length - 4} more
                  </Badge>
                )}
            </div>
          )}
        </div>

        {/* Right column: status + phone */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-3 flex-shrink-0">
          <OpenClosedStatus
            clinicHours={clinic.clinicHours}
            timezone={clinic.timezone}
          />
          {clinic.phone && (
            <div className="flex items-center gap-1 text-sm text-primary" itemProp="telephone">
              <Phone className="h-3.5 w-3.5" />
              {clinic.phone}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
