import Link from "next/link";
import { Metadata } from "next";
import { getAllStatesWithClinics, getClinicCountsByState } from "@/lib/clinic-queries";
import { getStateName } from "@/lib/us-states";

export const metadata: Metadata = {
  title: "Sitemap | Pain Clinics",
  description:
    "Navigate the Pain Clinics directory. Browse pain management clinics by state, explore our resources, and find the information you need.",
};

// Main Pages data
const mainPages = [
  { label: "Home", href: "/" },
  { label: "Find Clinics", href: "/clinics" },
  { label: "Blog", href: "/blog" },
  { label: "Pain Management Guide", href: "/pain-management-guide" },
  { label: "Treatment Options", href: "/treatment-options" },
];

const companyPages = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Submit a Clinic", href: "/submit-clinic" },
  { label: "Advertise With Us", href: "/advertise" },
  { label: "FAQ", href: "/faq" },
  { label: "Editorial Policy", href: "/editorial-policy" },
];

const legalPages = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Medical Disclaimer", href: "/medical-disclaimer" },
  { label: "Accessibility", href: "/accessibility" },
];

export default async function SitemapPage() {
  // Fetch dynamic state data
  let states: string[] = [];
  let stateCountMap = new Map<string, number>();

  try {
    states = await getAllStatesWithClinics();
    const stateCounts = await getClinicCountsByState();
    stateCountMap = new Map(
      stateCounts.map((s) => [s.stateAbbreviation?.toUpperCase() || "", s.count])
    );
  } catch (error) {
    console.warn("Sitemap: Database unavailable for state data");
  }

  // Sort states alphabetically by full name
  const sortedStates = states
    .filter((s) => s)
    .map((abbr) => ({
      abbr: abbr.toUpperCase(),
      name: getStateName(abbr),
      count: stateCountMap.get(abbr.toUpperCase()) || 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Sitemap</h1>
        <p className="text-muted-foreground mb-8">
          Find your way around Pain Clinics. Browse our complete directory of pages and resources.
        </p>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Pages */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Main Pages</h2>
            <ul className="space-y-2">
              {mainPages.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="text-primary hover:underline"
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Company Pages */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Company</h2>
            <ul className="space-y-2">
              {companyPages.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="text-primary hover:underline"
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Legal Pages */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Legal</h2>
            <ul className="space-y-2">
              {legalPages.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="text-primary hover:underline"
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Browse by State */}
        {sortedStates.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Browse by State</h2>
            <p className="text-muted-foreground mb-6">
              Find pain management clinics in your state. Click on a state to view all available clinics.
            </p>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {sortedStates.map((state) => (
                <Link
                  key={state.abbr}
                  href={`/pain-management/${state.abbr.toLowerCase()}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <span className="font-medium">{state.abbr}</span>
                  <span className="text-sm text-muted-foreground">
                    {state.count} {state.count === 1 ? "clinic" : "clinics"}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All States List (for SEO) */}
        {sortedStates.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">All States</h2>
            <div className="columns-2 sm:columns-3 md:columns-4 gap-4">
              {sortedStates.map((state) => (
                <div key={state.abbr} className="break-inside-avoid mb-2">
                  <Link
                    href={`/pain-management/${state.abbr.toLowerCase()}`}
                    className="text-primary hover:underline"
                  >
                    {state.name}
                  </Link>
                  <span className="text-muted-foreground text-sm ml-1">
                    ({state.count})
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
