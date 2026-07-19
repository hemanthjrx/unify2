/**
 * reset-seed.ts
 * Explicit reset script: wipes all user data and re-seeds the database
 * with the 160 hardcoded EWIT students + system accounts.
 *
 * DESTRUCTIVE — run only when you intentionally want a clean slate.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run reset-seed
 *
 * This is intentionally NOT run automatically on server start.
 * auto-seed.ts handles first-boot seeding for empty databases.
 */

import bcrypt from "bcrypt";
import { pool } from "@workspace/db";
import { ALL_STUDENTS, SYSTEM_ACCOUNTS } from "../../../artifacts/api-server/src/data/students.js";

async function resetAndSeed() {
  console.log("⚠️  DESTRUCTIVE RESET — wiping users and all related data...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Wipe everything (CASCADE handles all FK-dependent tables)
    await client.query("TRUNCATE TABLE users CASCADE");
    console.log("✓ Cleared users + dependent tables");

    // 2. Insert system accounts
    let adminId: number | null = null;
    for (const sys of SYSTEM_ACCOUNTS) {
      const hash = await bcrypt.hash(sys.password, 10);
      const r = await client.query<{ id: number }>(
        `INSERT INTO users
           (username, name, email, avatar_color, password_hash,
            account_status, onboarding_complete, role, coins, is_private, created_at)
         VALUES ($1,$2,$3,$4,$5,'approved',true,$6,100,false,NOW())
         RETURNING id`,
        [sys.username, sys.name, sys.email, sys.avatarColor, hash, sys.role]
      );
      if (sys.role === "admin") adminId = r.rows[0].id;
      console.log(`  ✓ System account: ${sys.username} (${sys.role})`);
    }

    // 3. Insert 160 students
    const studentHash = await bcrypt.hash("Student123", 10);
    let inserted = 0;
    for (const s of ALL_STUDENTS) {
      await client.query(
        `INSERT INTO users
           (username, name, usn, email, branch, semester, avatar_color,
            password_hash, account_status, onboarding_complete, role,
            coins, is_private, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'approved',true,'user',$9,false,NOW())`,
        [
          s.username, s.name, s.usn, s.email,
          s.department, s.semester, s.avatarColor,
          studentHash,
          50 + Math.floor(Math.random() * 200),
        ]
      );
      inserted++;
    }
    console.log(`  ✓ Inserted ${inserted} students`);

    await client.query("COMMIT");
    console.log(`\n✅ Reset complete — ${inserted} students + ${SYSTEM_ACCOUNTS.length} system accounts`);
    console.log("   All student password: Student123");
    console.log("   Admin: ADMIN / admin123");
    console.log("   Moderator: MODERATOR / mod123");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Reset failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetAndSeed();
