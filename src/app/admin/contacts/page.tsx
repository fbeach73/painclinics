import { Suspense } from "react";
import { Contact2, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getContacts, getContactCountsByTag } from "@/lib/contact-queries";
import { ContactsFilterTabs } from "./contacts-filter-tabs";
import { ContactsPagination } from "./contacts-pagination";
import { ContactsSearch } from "./contacts-search";
import { ContactsTable } from "./contacts-table";

interface PageProps {
  searchParams: Promise<{ tag?: string; page?: string; search?: string }>;
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tagFilter = params.tag || "all";
  const currentPage = parseInt(params.page || "1", 10);
  const searchQuery = params.search || "";

  const tagArg = tagFilter === "all" ? undefined : tagFilter;
  const searchArg = searchQuery || undefined;

  const [result, counts] = await Promise.all([
    getContacts({
      ...(tagArg !== undefined && { tag: tagArg }),
      ...(searchArg !== undefined && { search: searchArg }),
      page: currentPage,
      pageSize: 25,
    }),
    getContactCountsByTag(),
  ]);

  const { contacts, total, page, pageSize, totalPages } = result;

  // Build base URL for pagination
  const baseUrlParams = new URLSearchParams();
  if (tagFilter !== "all") {
    baseUrlParams.set("tag", tagFilter);
  }
  if (searchQuery) {
    baseUrlParams.set("search", searchQuery);
  }
  const baseUrl = `/admin/contacts${baseUrlParams.toString() ? `?${baseUrlParams.toString()}` : ""}`;

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Unified view of users and leads, deduped by email
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Contact2 className="h-5 w-5" />
              <CardTitle>All Contacts</CardTitle>
            </div>
            <Suspense fallback={<Skeleton className="h-9 w-80" />}>
              <ContactsSearch />
            </Suspense>
          </div>
          <CardDescription>
            Browse and filter contacts by source tag
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactsFilterTabs currentTag={tagFilter} counts={counts} />

          {contacts.length === 0 ? (
            <div className="text-center py-8 mt-4">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? `No contacts found matching "${searchQuery}"`
                  : tagFilter === "all"
                    ? "No contacts found."
                    : `No ${tagFilter} contacts found.`}
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4">
                <ContactsTable contacts={contacts} />
              </div>

              <ContactsPagination
                currentPage={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                baseUrl={baseUrl}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
