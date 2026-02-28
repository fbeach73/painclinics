import Link from "next/link";
import { Logo } from "@/components/shadcnblocks/logo";
import { getClinicCountsByState, getAllCitiesWithClinics } from "@/lib/clinic-queries";
import { getStateName } from "@/lib/us-states";

// Static link data
const resourcesLinks = [
  { label: "Browse All Clinics", href: "/clinics" },
  { label: "Find Clinics Near Me", href: "/clinics" },
  { label: "Pain Tracking Templates", href: "/pain-tracking" },
  { label: "Blog", href: "/blog" },
  { label: "Pain Management Guide", href: "/pain-management-guide" },
  { label: "Treatment Options", href: "/treatment-options" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Accessibility", href: "/accessibility" },
  { label: "Medical Disclaimer", href: "/medical-disclaimer" },
  { label: "Email Preferences", href: "/email-preferences" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Submit a Clinic", href: "/submit-clinic" },
  { label: "FAQ", href: "/faq" },
  { label: "Sitemap", href: "/sitemap-page" },
];

// Popular search keywords for SEO
const popularSearches = [
  { label: "pain clinics near me", href: "/clinics" },
  { label: "pain management near me", href: "/clinics" },
  { label: "pain doctors near me", href: "/clinics" },
  { label: "back pain specialist", href: "/clinics" },
  { label: "spine specialists near me", href: "/clinics" },
  { label: "chronic pain clinics near me", href: "/clinics" },
  { label: "chronic pain treatment", href: "/treatment-options" },
  { label: "fibromyalgia treatment", href: "/treatment-options" },
  { label: "nerve pain treatment", href: "/treatment-options" },
];

interface FooterLinkColumnProps {
  title: string;
  links: Array<{ label: string; href: string }>;
}

function FooterLinkColumn({ title, links }: FooterLinkColumnProps) {
  return (
    <div>
      <h3 className="font-bold text-foreground mb-4">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  // Fetch dynamic location data
  let topCities: Array<{ city: string; stateAbbreviation: string | null; count: number }> = [];
  let topStates: Array<{ stateAbbreviation: string | null; count: number; stateName: string }> = [];

  try {
    const stateCounts = await getClinicCountsByState();
    const cityCounts = await getAllCitiesWithClinics();

    topStates = stateCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((s) => ({
        ...s,
        stateName: getStateName(s.stateAbbreviation || ""),
      }));

    topCities = cityCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch (error) {
    console.warn("Footer: Database unavailable for location data");
  }

  // Generate location URLs
  const getCityUrl = (city: string, state: string | null) =>
    `/pain-management/${state?.toLowerCase()}/${city.toLowerCase().replace(/\s+/g, "-")}/`;

  const getStateUrl = (state: string | null) =>
    `/pain-management/${state?.toLowerCase()}/`;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background pb-12">
      {/* Main Footer Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Column 1: Logo + Tagline */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="md" showText={true} className="mb-4" />
            <p className="text-sm text-muted-foreground">
              Find trusted pain management clinics near you. We help connect patients with
              qualified pain specialists across the United States.
            </p>
            <Link
              href="/for-clinics"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Get Featured!
            </Link>
          </div>

          {/* Column 2: Resources */}
          <FooterLinkColumn title="Resources" links={resourcesLinks} />

          {/* Column 3: Legal */}
          <FooterLinkColumn title="Legal" links={legalLinks} />

          {/* Column 4: Company */}
          <FooterLinkColumn title="Company" links={companyLinks} />

          {/* Column 5: Popular Locations (Dynamic) */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Popular Locations</h3>
            {topStates.length > 0 || topCities.length > 0 ? (
              <div className="space-y-4">
                {topStates.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Top States
                    </h4>
                    <ul className="space-y-1">
                      {topStates.slice(0, 4).map((state) => (
                        <li key={state.stateAbbreviation}>
                          <Link
                            href={getStateUrl(state.stateAbbreviation)}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {state.stateName}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {topCities.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Top Cities
                    </h4>
                    <ul className="space-y-1">
                      {topCities.slice(0, 4).map((city) => (
                        <li key={`${city.city}-${city.stateAbbreviation}`}>
                          <Link
                            href={getCityUrl(city.city, city.stateAbbreviation)}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {city.city}, {city.stateAbbreviation}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link href="/clinics" className="hover:text-foreground transition-colors">
                  Browse all locations
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Popular Searches Section */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">Popular Searches:</span>
            {popularSearches.map((search, index) => (
              <span key={search.label} className="flex items-center">
                <Link
                  href={search.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {search.label}
                </Link>
                {index < popularSearches.length - 1 && (
                  <span className="text-muted-foreground mx-2">|</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-6">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            &copy; {currentYear} Pain Clinics. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
