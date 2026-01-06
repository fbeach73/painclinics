import { desc, sql, isNotNull } from "drizzle-orm";
import { UserCheck, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 100;

function formatDateTime(date: Date | null) {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeTime(date: Date | null) {
  if (!date) return "";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return "";
}

function getRoleBadge(role: string) {
  switch (role) {
    case "admin":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Admin
        </Badge>
      );
    case "clinic_owner":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Owner
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          User
        </Badge>
      );
  }
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const offset = (currentPage - 1) * PAGE_SIZE;

  // Get users with lastLoginAt, ordered by most recent
  const [users, totalResult] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(isNotNull(user.lastLoginAt))
      .orderBy(desc(user.lastLoginAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(isNotNull(user.lastLoginAt)),
  ]);

  const totalUsers = totalResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Activity</h1>
          <p className="text-muted-foreground">
            View recently logged-in users
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
          {totalUsers} users logged in
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            <CardTitle>Recent Logins</CardTitle>
          </div>
          <CardDescription>
            Users sorted by most recent login time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No user login activity found.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Member Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.image || undefined} />
                            <AvatarFallback>
                              {u.name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formatDateTime(u.lastLoginAt)}
                          </div>
                          {u.lastLoginAt && (
                            <div className="text-sm text-muted-foreground">
                              {formatRelativeTime(u.lastLoginAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(u.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1}-{Math.min(offset + PAGE_SIZE, totalUsers)} of {totalUsers} users
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <a
                    href={`/admin/users?page=${currentPage - 1}`}
                    className="px-3 py-1 text-sm border rounded-md hover:bg-muted"
                  >
                    Previous
                  </a>
                )}
                <span className="px-3 py-1 text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage < totalPages && (
                  <a
                    href={`/admin/users?page=${currentPage + 1}`}
                    className="px-3 py-1 text-sm border rounded-md hover:bg-muted"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
