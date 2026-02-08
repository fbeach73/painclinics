import { DirectoryLayout } from "@/components/directory/directory-layout";
import { parseFilters, type DirectoryFilters } from "@/lib/directory/filters";
import {
  getFilteredClinics,
  getNearbyCities,
  getServiceCounts,
  getInsuranceCounts,
} from "@/lib/directory/queries";

interface CityPainManagementPageProps {
  cityName: string;
  stateName: string;
  stateAbbrev: string;
  searchParams: Record<string, string | string[] | undefined>;
}

export async function CityPainManagementPageContent({
  cityName,
  stateName,
  stateAbbrev,
  searchParams,
}: CityPainManagementPageProps) {
  const filters: DirectoryFilters = parseFilters(searchParams);
  const citySlug = cityName.toLowerCase().replace(/\s+/g, "-");

  // Fetch filtered results + browse-by data in parallel
  const [result, specialties, insuranceList, nearbyCities] = await Promise.all([
    getFilteredClinics({ stateAbbrev, city: cityName }, filters),
    getServiceCounts(stateAbbrev, cityName),
    getInsuranceCounts(stateAbbrev, cityName),
    getNearbyCities(stateAbbrev, cityName),
  ]);

  const locationName = `${cityName}, ${stateAbbrev}`;

  return (
    <DirectoryLayout
      locationName={locationName}
      stateName={stateName}
      stateAbbrev={stateAbbrev}
      cityName={cityName}
      citySlug={citySlug}
      result={result}
      filters={filters}
      specialties={specialties}
      insuranceList={insuranceList}
      nearbyCities={nearbyCities}
    />
  );
}
