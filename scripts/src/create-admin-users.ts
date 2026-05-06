import pg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createUsers() {
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const modPasswordHash = await bcrypt.hash("mod123", 10);

  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO users (username, name, role, password_hash, coins, account_status, onboarding_complete, is_private, avatar_color, banner_color)
      VALUES ($1, $2, $3, $4, 999, 'approved', true, false, '#e85d75', '#1a1040')
      ON CONFLICT (username) DO UPDATE
        SET role = EXCLUDED.role,
            password_hash = EXCLUDED.password_hash,
            name = EXCLUDED.name
    `, ["ADMIN", "Admin", "admin", adminPasswordHash]);
    console.log("✅ Admin user created/updated: ADMIN / admin123");

    await client.query(`
      INSERT INTO users (username, name, role, password_hash, coins, account_status, onboarding_complete, is_private, avatar_color, banner_color)
      VALUES ($1, $2, $3, $4, 999, 'approved', true, false, '#3b82f6', '#1a1040')
      ON CONFLICT (username) DO UPDATE
        SET role = EXCLUDED.role,
            password_hash = EXCLUDED.password_hash,
            name = EXCLUDED.name
    `, ["MODERATOR", "Moderator", "moderator", modPasswordHash]);
    console.log("✅ Moderator user created/updated: MODERATOR / mod123");
  } finally {
    client.release();
    await pool.end();
  }
}

createUsers().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
