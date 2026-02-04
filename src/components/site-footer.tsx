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
  { label: "Advertise With Us", href: "/for-clinics" },
  { label: "FAQ", href: "/faq" },
  { label: "Sitemap", href: "/sitemap-page" },
];

// Popular search keywords for SEO
const popularSearches = [
  { label: "pain management near me", href: "/clinics" },
  { label: "chronic pain treatment", href: "/treatment-options" },
  { label: "back pain specialist", href: "/clinics" },
  { label: "pain doctor near me", href: "/clinics" },
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
    <footer className="border-t bg-background">
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} Pain Clinics. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link
                href="/medical-disclaimer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Medical Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
