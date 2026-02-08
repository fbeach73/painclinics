import { Building2, Star, Shield, Stethoscope } from "lucide-react";
import type { DirectoryStats } from "@/lib/directory/queries";

interface StatsBarProps {
  stats: DirectoryStats;
  locationName: string;
}

export function StatsBar({ stats }: StatsBarProps) {
  const topSpecialtiesStr = stats.topSpecialties
    .slice(0, 3)
    .map((s) => `${s.name} (${s.count})`)
    .join(" · ");

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      {/* Stat pills row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="font-semibold">{stats.filteredCount.toLocaleString()}</span>
          <span className="text-muted-foreground">
            {stats.filteredCount !== stats.totalCount
              ? `of ${stats.totalCount.toLocaleString()} Clinics`
              : "Clinics"}
          </span>
        </div>

        {stats.avgRating !== null && (
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{stats.avgRating}</span>
            <span className="text-muted-foreground">Avg Rating</span>
          </div>
        )}

        {stats.verifiedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="font-semibold">{stats.verifiedCount}</span>
            <span className="text-muted-foreground">Verified</span>
          </div>
        )}
      </div>

      {/* Top specialties row */}
      {topSpecialtiesStr && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Stethoscope className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Top Specialties: {topSpecialtiesStr}</span>
        </div>
      )}
    </div>
  );
}
