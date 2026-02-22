import { NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  try {
    // Summary: total vs bot vs legit clicks
    const summary = await db.execute(sql`
      SELECT
        COUNT(*)::int                                            AS total_clicks,
        COUNT(*) FILTER (WHERE is_bot = true)::int              AS bot_clicks,
        COUNT(*) FILTER (WHERE is_bot = false OR is_bot IS NULL)::int AS legit_clicks
      FROM ad_clicks
    `);

    // Bot click breakdown by reason
    const botReasons = await db.execute(sql`
      SELECT
        COALESCE(bot_reason, 'unknown') AS reason,
        COUNT(*)::int                   AS count
      FROM ad_clicks
      WHERE is_bot = true
      GROUP BY bot_reason
      ORDER BY count DESC
    `);

    // Top clickers by IP (legit only)
    const topIps = await db.execute(sql`
      SELECT
        c.ip_address,
        LEFT(c.user_agent, 150) as user_agent,
        COUNT(*)::int as clicks,
        MIN(c.created_at) as first_click,
        MAX(c.created_at) as last_click
      FROM ad_clicks c
      WHERE c.is_bot = false OR c.is_bot IS NULL
      GROUP BY c.ip_address, LEFT(c.user_agent, 150)
      ORDER BY clicks DESC
      LIMIT 25
    `);

    // Top bot IPs
    const topBotIps = await db.execute(sql`
      SELECT
        c.ip_address,
        LEFT(c.user_agent, 150) as user_agent,
        c.bot_reason,
        COUNT(*)::int as clicks,
        MIN(c.created_at) as first_click,
        MAX(c.created_at) as last_click
      FROM ad_clicks c
      WHERE c.is_bot = true
      GROUP BY c.ip_address, LEFT(c.user_agent, 150), c.bot_reason
      ORDER BY clicks DESC
      LIMIT 25
    `);

    // Recent legit clicks with page context
    const recentClicks = await db.execute(sql`
      SELECT
        c.ip_address,
        LEFT(c.user_agent, 150) as user_agent,
        c.created_at,
        i.page_path,
        cr.name as creative_name
      FROM ad_clicks c
      JOIN ad_impressions i ON i.click_id = c.click_id
      JOIN ad_creatives cr ON cr.id = i.creative_id
      WHERE c.is_bot = false OR c.is_bot IS NULL
      ORDER BY c.created_at DESC
      LIMIT 50
    `);

    // Recent bot clicks with page context
    const recentBotClicks = await db.execute(sql`
      SELECT
        c.ip_address,
        LEFT(c.user_agent, 150) as user_agent,
        c.bot_reason,
        c.created_at,
        i.page_path,
        cr.name as creative_name
      FROM ad_clicks c
      JOIN ad_impressions i ON i.click_id = c.click_id
      JOIN ad_creatives cr ON cr.id = i.creative_id
      WHERE c.is_bot = true
      ORDER BY c.created_at DESC
      LIMIT 50
    `);

    // Clicks per hour (last 48h) — legit only
    const clicksByHour = await db.execute(sql`
      SELECT
        to_char(created_at - INTERVAL '4 hours', 'YYYY-MM-DD HH24:00') as hour,
        COUNT(*) FILTER (WHERE is_bot = false OR is_bot IS NULL)::int   as legit_clicks,
        COUNT(*) FILTER (WHERE is_bot = true)::int                      as bot_clicks
      FROM ad_clicks
      WHERE created_at >= NOW() - INTERVAL '48 hours'
      GROUP BY to_char(created_at - INTERVAL '4 hours', 'YYYY-MM-DD HH24:00')
      ORDER BY hour DESC
    `);

    return NextResponse.json({
      summary: Array.from(summary)[0] ?? {
        total_clicks: 0,
        bot_clicks: 0,
        legit_clicks: 0,
      },
      botReasons: Array.from(botReasons),
      topIps: Array.from(topIps),
      topBotIps: Array.from(topBotIps),
      recentClicks: Array.from(recentClicks),
      recentBotClicks: Array.from(recentBotClicks),
      clicksByHour: Array.from(clicksByHour),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
