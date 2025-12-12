"use client";

import {
  Accessibility,
  Car,
  CheckCircle,
  CreditCard,
  Languages,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Map amenity names to appropriate icons
const AMENITY_ICONS: Record<string, LucideIcon> = {
  // Accessibility
  "wheelchair accessible": Accessibility,
  "wheelchair accessible entrance": Accessibility,
  "wheelchair accessible restroom": Accessibility,
  "wheelchair accessible seating": Accessibility,
  "wheelchair accessible parking lot": Accessibility,
  // Parking
  parking: Car,
  "free parking": Car,
  "parking lot": Car,
  "free parking lot": Car,
  "paid parking lot": Car,
  "street parking": Car,
  // Technology
  wifi: Wifi,
  "free wifi": Wifi,
  // Payments
  "accepts credit cards": CreditCard,
  "credit cards accepted": CreditCard,
  "credit cards": CreditCard,
  // Languages
  "spanish speaking": Languages,
  "bilingual staff": Languages,
  "language assistance": Languages,
};

interface ClinicAmenitiesProps {
  amenities: string[];
  className?: string;
}

export function ClinicAmenities({ amenities, className }: ClinicAmenitiesProps) {
  if (!amenities?.length) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Amenities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity, i) => {
            // Look up icon by lowercase amenity name
            const Icon = AMENITY_ICONS[amenity.toLowerCase()] || CheckCircle;
            return (
              <Badge key={i} variant="outline" className="gap-1.5 py-1.5">
                <Icon className="h-3.5 w-3.5" />
                {amenity}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
