import { Suspense } from "react";
import { MessageSquareHeart, Search } from "lucide-react";
import { desc, sql, eq, inArray } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { contacts, consultLeadMatches, clinics, analyticsEvents } from "@/lib/schema";
import { ConsultLeadsSearch } from "./consult-leads-search";
import { ConsultLeadsPagination } from "./consult-leads-pagination";
import { MatchStatusSelect } from "./match-status-select";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; limit?: string }>;
}

type MatchStatus = "matched" | "contacted" | "booked" | "converted";

const STATUS_COLORS: Record<MatchStatus, string> = {
  matched: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  contacted: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  booked: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  converted: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildWhereClause(q: string) {
  if (q) {
    return sql`'consult-user' = ANY(${contacts.tags}) AND (
      ${contacts.name} ILIKE ${`%${q}%`} OR
      ${contacts.email} ILIKE ${`%${q}%`}
    )`;
  }
  return sql`'consult-user' = ANY(${contacts.tags})`;
}

export default async function ConsultLeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const pageSize = Math.min(parseInt(params.limit || "50", 10), 100);
  const currentPage = Math.max(parseInt(params.page || "1", 10), 1);
  const offset = (currentPage - 1) * pageSize;

  const where = buildWhereClause(q);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const [leads, totalResult, todayResult, weekResult, chatOpensResult, chatMessagesResult, avgDepthResult] = await Promise.all([
    db
      .select()
      .from(contacts)
      .where(where)
      .orderBy(desc(contacts.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(sql`'consult-user' = ANY(${contacts.tags})`),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(
        sql`'consult-user' = ANY(${contacts.tags}) AND ${contacts.createdAt} >= ${todayStart.toISOString()}`
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(
        sql`'consult-user' = ANY(${contacts.tags}) AND ${contacts.createdAt} >= ${weekStart.toISOString()}`
      ),
    // Chat analytics: total opens
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, "consult_start")),
    // Chat analytics: total messages sent by users
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, "consult_message")),
    // Chat analytics: avg messages per session
    db
      .select({ avg: sql<number>`COALESCE(ROUND(AVG(msg_count)::numeric, 1), 0)::float` })
      .from(
        sql`(
          SELECT ${analyticsEvents.sessionHash}, COUNT(*) as msg_count
          FROM ${analyticsEvents}
          WHERE ${analyticsEvents.eventType} = 'consult_message'
          GROUP BY ${analyticsEvents.sessionHash}
        ) sub`
      ),
  ]);

  const totalCount = totalResult[0]?.count ?? 0;
  const todayCount = todayResult[0]?.count ?? 0;
  const weekCount = weekResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const chatOpens = chatOpensResult[0]?.count ?? 0;
  const chatMessages = chatMessagesResult[0]?.count ?? 0;
  const avgDepth = avgDepthResult[0]?.avg ?? 0;

  // Fetch matched clinics for this page of leads
  const leadIds = leads.map((l) => l.id);
  let matchRows: Array<{
    id: string;
    contactId: string;
    clinicId: string;
    status: string;
    clinicTitle: string;
    clinicPermalink: string;
  }> = [];

  if (leadIds.length > 0) {
    try {
      matchRows = await db
        .select({
          id: consultLeadMatches.id,
          contactId: consultLeadMatches.contactId,
          clinicId: consultLeadMatches.clinicId,
          status: consultLeadMatches.status,
          clinicTitle: clinics.title,
          clinicPermalink: clinics.permalink,
        })
        .from(consultLeadMatches)
        .innerJoin(clinics, eq(consultLeadMatches.clinicId, clinics.id))
        .where(inArray(consultLeadMatches.contactId, leadIds));
    } catch {
      // Table may not have data yet — proceed without matches
      matchRows = [];
    }
  }

  // Group matches by contactId
  const matchesByContact = new Map<
    string,
    Array<{
      id: string;
      status: MatchStatus;
      clinicTitle: string;
      clinicPermalink: string;
    }>
  >();
  for (const row of matchRows) {
    const existing = matchesByContact.get(row.contactId) ?? [];
    existing.push({
      id: row.id,
      status: row.status as MatchStatus,
      clinicTitle: row.clinicTitle,
      clinicPermalink: row.clinicPermalink,
    });
    matchesByContact.set(row.contactId, existing);
  }

  const baseUrlParams = new URLSearchParams();
  if (q) baseUrlParams.set("q", q);
  const baseUrl = `/admin/consult-leads${baseUrlParams.toString() ? `?${baseUrlParams.toString()}` : ""}`;

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          PainConsult AI Leads
        </h1>
        <p className="text-muted-foreground">
          Leads captured from the AI pain consultation chat
        </p>
      </div>

      {/* Lead stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalCount.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {weekCount.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {todayCount.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Chat engagement stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {chatOpens.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Chat opens</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {chatMessages.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {avgDepth}
            </div>
            <p className="text-sm text-muted-foreground">Avg messages/session</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MessageSquareHeart className="h-5 w-5" />
              <CardTitle>Consult Leads</CardTitle>
            </div>
            <Suspense fallback={<Skeleton className="h-9 w-80" />}>
              <ConsultLeadsSearch />
            </Suspense>
          </div>
          <CardDescription>
            Users who completed the PainConsult AI chat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {q
                  ? `No consult leads found matching "${q}"`
                  : "No consult leads yet. Leads will appear here when users complete the PainConsult AI chat."}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Zip</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Matched Clinics</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => {
                      const meta = (lead.metadata ?? {}) as Record<
                        string,
                        unknown
                      >;
                      const condition = (meta.condition as string) || "";
                      const zipCode = (meta.zipCode as string) || "—";
                      const age = (meta.age as string) || "—";
                      const consultDate = (meta.consultDate as string) || "";
                      const matches = matchesByContact.get(lead.id) ?? [];

                      return (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium text-gray-900 dark:text-white">
                            {lead.name || "—"}
                          </TableCell>
                          <TableCell>
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {lead.email}
                            </a>
                          </TableCell>
                          <TableCell>
                            {condition ? (
                              <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900 border-0">
                                {condition}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-neutral-400">
                            {zipCode}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-neutral-400">
                            {age}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-neutral-400">
                            {consultDate
                              ? formatDate(consultDate)
                              : formatDate(lead.createdAt.toISOString())}
                          </TableCell>
                          <TableCell>
                            {matches.length === 0 ? (
                              <span className="text-muted-foreground text-sm">—</span>
                            ) : (
                              <div className="space-y-1.5 min-w-[240px]">
                                {matches.map((match) => (
                                  <div
                                    key={match.id}
                                    className="flex items-center gap-2"
                                  >
                                    <a
                                      href={`/pain-management/${match.clinicPermalink}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[140px]"
                                      title={match.clinicTitle}
                                    >
                                      {match.clinicTitle}
                                    </a>
                                    <span
                                      className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_COLORS[match.status]}`}
                                    >
                                      {match.status}
                                    </span>
                                    <MatchStatusSelect
                                      matchId={match.id}
                                      initialStatus={match.status}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <ConsultLeadsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={totalCount}
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
