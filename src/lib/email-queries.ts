import { desc, eq, sql, and, gte, lte, count } from "drizzle-orm";
import { db } from "./db";
import { emailLogs, emailStatusEnum } from "./schema";

export interface EmailStats {
  total: number;
  delivered: number;
  bounced: number;
  complained: number;
  failed: number;
  opened: number;
  clicked: number;
  queued: number;
}

export async function getEmailStats(startDate?: Date, endDate?: Date): Promise<EmailStats> {
  const conditions = [];
  if (startDate) conditions.push(gte(emailLogs.sentAt, startDate));
  if (endDate) conditions.push(lte(emailLogs.sentAt, endDate));

  const result = await db
    .select({
      total: sql<number>`count(*)::int`,
      delivered: sql<number>`count(*) filter (where ${emailLogs.status} = 'delivered')::int`,
      bounced: sql<number>`count(*) filter (where ${emailLogs.status} = 'bounced')::int`,
      complained: sql<number>`count(*) filter (where ${emailLogs.status} = 'complained')::int`,
      failed: sql<number>`count(*) filter (where ${emailLogs.status} = 'failed')::int`,
      opened: sql<number>`count(*) filter (where ${emailLogs.status} = 'opened')::int`,
      clicked: sql<number>`count(*) filter (where ${emailLogs.status} = 'clicked')::int`,
      queued: sql<number>`count(*) filter (where ${emailLogs.status} = 'queued')::int`,
    })
    .from(emailLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result[0] ?? {
    total: 0,
    delivered: 0,
    bounced: 0,
    complained: 0,
    failed: 0,
    opened: 0,
    clicked: 0,
    queued: 0,
  };
}

export async function getEmailStatsByTemplate(startDate?: Date, endDate?: Date) {
  const conditions = [];
  if (startDate) conditions.push(gte(emailLogs.sentAt, startDate));
  if (endDate) conditions.push(lte(emailLogs.sentAt, endDate));

  return db
    .select({
      templateName: emailLogs.templateName,
      total: sql<number>`count(*)::int`,
      delivered: sql<number>`count(*) filter (where ${emailLogs.status} = 'delivered')::int`,
      bounced: sql<number>`count(*) filter (where ${emailLogs.status} = 'bounced')::int`,
      failed: sql<number>`count(*) filter (where ${emailLogs.status} = 'failed')::int`,
      opened: sql<number>`count(*) filter (where ${emailLogs.status} = 'opened')::int`,
      clicked: sql<number>`count(*) filter (where ${emailLogs.status} = 'clicked')::int`,
    })
    .from(emailLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(emailLogs.templateName)
    .orderBy(desc(sql`count(*)`));
}

export type EmailStatus = (typeof emailStatusEnum.enumValues)[number];

export interface GetEmailLogsOptions {
  limit?: number | undefined;
  offset?: number | undefined;
  status?: EmailStatus | undefined;
  templateName?: string | undefined;
  recipientEmail?: string | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
}

export async function getEmailLogs(options: GetEmailLogsOptions = {}) {
  const {
    limit = 50,
    offset = 0,
    status,
    templateName,
    recipientEmail,
    startDate,
    endDate,
  } = options;

  const conditions = [];
  if (status) conditions.push(eq(emailLogs.status, status));
  if (templateName) conditions.push(eq(emailLogs.templateName, templateName));
  if (recipientEmail) conditions.push(eq(emailLogs.recipientEmail, recipientEmail));
  if (startDate) conditions.push(gte(emailLogs.sentAt, startDate));
  if (endDate) conditions.push(lte(emailLogs.sentAt, endDate));

  const [logs, totalResult] = await Promise.all([
    db
      .select()
      .from(emailLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(emailLogs.sentAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(emailLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  return {
    logs,
    total: totalResult[0]?.count ?? 0,
    limit,
    offset,
  };
}

export async function getUniqueTemplateNames(): Promise<string[]> {
  const result = await db
    .selectDistinct({ templateName: emailLogs.templateName })
    .from(emailLogs)
    .orderBy(emailLogs.templateName);

  return result.map((r) => r.templateName);
}

export async function getEmailLogById(id: string) {
  const result = await db
    .select()
    .from(emailLogs)
    .where(eq(emailLogs.id, id))
    .limit(1);

  return result[0] ?? null;
}
