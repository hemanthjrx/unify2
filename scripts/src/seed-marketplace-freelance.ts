/**
 * seed-marketplace-freelance.ts
 * One-shot script: inserts the hardcoded marketplace listings and
 * freelance services into the existing DB (safe to re-run — uses ON CONFLICT DO NOTHING).
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run seed-marketplace-freelance
 */

import pg from "pg";
import { ALL_STUDENTS } from "../../artifacts/api-server/src/data/students.js";
import { MARKETPLACE_LISTINGS, FREELANCE_LISTINGS } from "../../artifacts/api-server/src/data/marketplace-freelance.js";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    // Fetch all user IDs keyed by username (stable identifier)
    const usernames = ALL_STUDENTS.map((s) => s.username);
    const res = await client.query<{ id: number; username: string }>(
      `SELECT id, username FROM users WHERE username = ANY($1::text[])`,
      [usernames]
    );
    const byUsername: Record<string, number> = {};
    for (const row of res.rows) byUsername[row.username] = row.id;

    // Build userIds[] in the same order as ALL_STUDENTS (matching sellerIdx / providerIdx)
    const userIds: number[] = ALL_STUDENTS.map((s) => {
      const id = byUsername[s.username];
      if (!id) throw new Error(`Student "${s.username}" not found in DB — run main seed first`);
      return id;
    });

    await client.query("BEGIN");

    // ── Marketplace listings ──
    let mpInserted = 0;
    for (const listing of MARKETPLACE_LISTINGS) {
      const sellerId = userIds[listing.sellerIdx];
      const daysAgo = Math.floor(Math.random() * 60) + 5;
      const prodRes = await client.query<{ id: number }>(
        `INSERT INTO marketplace_products (seller_id, title, description, price, category, images, created_at)
         VALUES ($1,$2,$3,$4,$5,'{}',NOW() - ($6 || ' days')::interval)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [sellerId, listing.title, listing.description, listing.price, listing.category, daysAgo]
      );
      if (!prodRes.rows[0]) {
        console.log(`  ⚠ Skipped (already exists): ${listing.title}`);
        continue;
      }
      const productId = prodRes.rows[0].id;
      mpInserted++;

      for (const rev of listing.reviews) {
        const reviewerId = userIds[rev.reviewerIdx];
        const rDays = Math.floor(Math.random() * 30) + 1;
        await client.query(
          `INSERT INTO product_reviews (product_id, reviewer_id, rating, comment, created_at)
           VALUES ($1,$2,$3,$4,NOW() - ($5 || ' days')::interval)
           ON CONFLICT DO NOTHING`,
          [productId, reviewerId, rev.rating, rev.comment, rDays]
        );
      }
      for (const rIdx of listing.extraRaterIdxs) {
        const reviewerId = userIds[rIdx];
        const rating = 3 + Math.floor(Math.random() * 3);
        const rDays = Math.floor(Math.random() * 45) + 1;
        await client.query(
          `INSERT INTO product_reviews (product_id, reviewer_id, rating, comment, created_at)
           VALUES ($1,$2,$3,NULL,NOW() - ($4 || ' days')::interval)
           ON CONFLICT DO NOTHING`,
          [productId, reviewerId, rating, rDays]
        );
      }
      console.log(`  ✓ Marketplace: ${listing.title}`);
    }

    // ── Freelance services ──
    let flInserted = 0;
    for (const service of FREELANCE_LISTINGS) {
      const providerId = userIds[service.providerIdx];
      const daysAgo = Math.floor(Math.random() * 60) + 5;
      const svcRes = await client.query<{ id: number }>(
        `INSERT INTO freelance_services (provider_id, title, description, price, category, images, delivery_days, created_at)
         VALUES ($1,$2,$3,$4,$5,'{}', $6, NOW() - ($7 || ' days')::interval)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [providerId, service.title, service.description, service.price, service.category, service.deliveryDays, daysAgo]
      );
      if (!svcRes.rows[0]) {
        console.log(`  ⚠ Skipped (already exists): ${service.title}`);
        continue;
      }
      const serviceId = svcRes.rows[0].id;
      flInserted++;

      for (const rev of service.reviews) {
        const reviewerId = userIds[rev.reviewerIdx];
        const rDays = Math.floor(Math.random() * 30) + 1;
        await client.query(
          `INSERT INTO service_reviews (service_id, reviewer_id, rating, comment, created_at)
           VALUES ($1,$2,$3,$4,NOW() - ($5 || ' days')::interval)
           ON CONFLICT DO NOTHING`,
          [serviceId, reviewerId, rev.rating, rev.comment, rDays]
        );
      }
      for (const rIdx of service.extraRaterIdxs) {
        const reviewerId = userIds[rIdx];
        const rating = 3 + Math.floor(Math.random() * 3);
        const rDays = Math.floor(Math.random() * 45) + 1;
        await client.query(
          `INSERT INTO service_reviews (service_id, reviewer_id, rating, comment, created_at)
           VALUES ($1,$2,$3,NULL,NOW() - ($4 || ' days')::interval)
           ON CONFLICT DO NOTHING`,
          [serviceId, reviewerId, rating, rDays]
        );
      }
      console.log(`  ✓ Freelance: ${service.title}`);
    }

    await client.query("COMMIT");
    console.log(`\n✅ Done — ${mpInserted} marketplace listings, ${flInserted} freelance services seeded`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
