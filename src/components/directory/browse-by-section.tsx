import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface BrowseItem {
  name: string;
  slug: string;
  count: number;
}

interface BrowseBySectionProps {
  stateAbbrev: string;
  citySlug?: string | undefined;
  specialties: BrowseItem[];
  insuranceList: BrowseItem[];
  nearbyCities: Array<{ city: string; count: number; slug: string }>;
}

export function BrowseBySection({
  stateAbbrev,
  citySlug,
  specialties,
  insuranceList,
  nearbyCities,
}: BrowseBySectionProps) {
  const basePath = citySlug
    ? `/pain-management/${stateAbbrev.toLowerCase()}/${citySlug}/`
    : `/pain-management/${stateAbbrev.toLowerCase()}/`;

  return (
    <div className="space-y-6">
      {/* Browse by Specialty */}
      {specialties.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Browse by Specialty</h2>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <Link
                key={s.slug}
                href={`${basePath}?specialty=${s.slug}`}
              >
                <Badge
                  variant="outline"
                  className="hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  {s.name}
                  <span className="ml-1 text-muted-foreground">({s.count})</span>
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Browse by Insurance */}
      {insuranceList.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Browse by Insurance</h2>
          <div className="flex flex-wrap gap-2">
            {insuranceList.map((ins) => (
              <Link
                key={ins.slug}
                href={`${basePath}?insurance=${ins.slug}`}
              >
                <Badge
                  variant="outline"
                  className="hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  {ins.name}
                  <span className="ml-1 text-muted-foreground">
                    ({ins.count})
                  </span>
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Nearby Cities */}
      {nearbyCities.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">
            {citySlug ? "Nearby Cities" : "Cities"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {nearbyCities.map((c) => (
              <Link
                key={c.slug}
                href={`/pain-management/${stateAbbrev.toLowerCase()}/${c.slug}/`}
              >
                <Badge
                  variant="outline"
                  className="hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  {c.city}
                  <span className="ml-1 text-muted-foreground">
                    ({c.count})
                  </span>
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
