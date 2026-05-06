import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Private accounts
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT TRUE`);

    // 2. Follow requests — add status column; existing rows are accepted
    await client.query(`ALTER TABLE follows ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`);
    await client.query(`UPDATE follows SET status = 'accepted' WHERE status = 'pending'`);

    // 3. Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT,
        kind TEXT NOT NULL DEFAULT 'text',
        file_url TEXT,
        file_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS messages_conv_idx
        ON messages(LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC)
    `);

    // 4. Hackathon fields on posts
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'post'`);
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS hackathon_date TEXT`);
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS hackathon_location TEXT`);
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS hackathon_team_size INTEGER`);
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS hackathon_skills TEXT[] DEFAULT '{}'`);

    await client.query("COMMIT");
    console.log("Migration v2 complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
