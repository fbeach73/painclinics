import { DirectoryLayout } from "@/components/directory/directory-layout";
import { parseFilters, type DirectoryFilters } from "@/lib/directory/filters";
import {
  getFilteredClinics,
  getNearbyCities,
  getServiceCounts,
  getInsuranceCounts,
} from "@/lib/directory/queries";

interface StatePainManagementPageProps {
  stateName: string;
  stateAbbrev: string;
  searchParams: Record<string, string | string[] | undefined>;
  useHostedAds: boolean;
}

export async function StatePainManagementPageContent({
  stateName,
  stateAbbrev,
  searchParams,
  useHostedAds,
}: StatePainManagementPageProps) {
  const filters: DirectoryFilters = parseFilters(searchParams);

  // Fetch filtered results + browse-by data in parallel
  const [result, specialties, insuranceList, cities] = await Promise.all([
    getFilteredClinics({ stateAbbrev }, filters),
    getServiceCounts(stateAbbrev),
    getInsuranceCounts(stateAbbrev),
    getNearbyCities(stateAbbrev, undefined, 20),
  ]);

  return (
    <DirectoryLayout
      locationName={stateName}
      stateName={stateName}
      stateAbbrev={stateAbbrev}
      result={result}
      filters={filters}
      specialties={specialties}
      insuranceList={insuranceList}
      useHostedAds={useHostedAds}
      nearbyCities={cities}
    />
  );
}
