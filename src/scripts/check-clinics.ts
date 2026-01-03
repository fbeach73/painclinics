import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import * as schema from "../lib/schema";

async function main() {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.email, "kyle.sweezey@gmail.com")
  });

  if (user === null || user === undefined) {
    console.log("User not found");
    return;
  }

  const clinics = await db.query.clinics.findMany({
    where: eq(schema.clinics.ownerUserId, user.id)
  });

  console.log("=== YOUR 4 CLINICS ===");
  for (const c of clinics) {
    console.log("");
    console.log("Clinic:", c.title);
    console.log("  ID:", c.id);
    console.log("  Tier:", c.featuredTier || "none");
    console.log("  Featured:", c.isFeatured);
  }

  const subs = await db.query.featuredSubscriptions.findMany({
    where: eq(schema.featuredSubscriptions.userId, user.id)
  });
  console.log("");
  console.log("=== SUBSCRIPTIONS:", subs.length, "===");

  process.exit(0);
}

main();
