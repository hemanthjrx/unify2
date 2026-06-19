import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Map: current_username OR usn → new username
const MAP: Record<string, string> = {
  // Main 20 students (by usn)
  "1EW25IC001": "GhostWriter",
  "1EW25IC002": "MustangGT",
  "1EW25IC008": "CodeNinja",
  "1EW25IC011": "PixelPilot",
  "1EW25IC020": "oghemz",       // Hemanth J R
  "1EW25IC003": "WordCrafter",
  "1EW25IC004": "BugHunter",
  "1EW25IC005": "StoryWeaver",
  "1EW25IC006": "HayabusaRider",
  "1EW25IC007": "QuietThinker",
  "1EW25IC009": "SyntaxError",
  "1EW25IC010": "LostPoet",
  "1EW25IC012": "NinjaZX6R",
  "1EW25IC013": "RedBullAddict",
  "1EW25IC014": "Duke390",
  "1EW25IC015": "CoffeeFuel",
  "1EW25IC016": "DevModeOn",
  "1EW25IC017": "MidnightOwl",
  "1EW25IC018": "WanderSoul",
  "1EW25IC019": "BlankCanvas",
  // Applicants (by usn)
  "1EW25IC021": "SupraMK4",
  "1EW25IC022": "CokeLover",
  "1EW25IC023": "ChaiPowered",
  "1EW25IC024": "MangoShake",
  "1EW25IC025": "837261",
  "1EW25IC026": "420420",
  "1EW25IC027": "998877",
  "1EW25IC028": "717171",
  "1EW25IC029": "300ZX",
  "1EW25IC030": "PotatoKing",
  "1EW25IC031": "SleepyPanda",
  "1EW25IC032": "LazyPenguin",
  "1EW25IC033": "MemeDealer",
  "1EW25IC034": "NoContext",
  "1EW25IC035": "Rohit123",
  "1EW25IC036": "Akhil07",
  "1EW25IC037": "Priya_21",
  "1EW25CS001": "Vishnu99",
  "1EW25CS002": "Ananya_05",
  "1EW25CS003": "MoonWalker",
  "1EW25CS004": "UrbanNomad",
  "1EW23IS010": "TurboKid",
  "1EW23IS011": "RocketBoy",
  "1EW23IS012": "NightDriver",
  "1EW23EC005": "StormRider",
};

async function run() {
  const client = await pool.connect();
  try {
    let updated = 0;
    for (const [usn, newUsername] of Object.entries(MAP)) {
      const res = await client.query(
        `UPDATE users SET username = $1 WHERE usn = $2 AND username != $1`,
        [newUsername, usn]
      );
      if ((res.rowCount ?? 0) > 0) updated++;
    }
    console.log(`✅ Updated ${updated} usernames`);

    const check = await client.query(
      `SELECT username, usn FROM users WHERE role='user' AND usn IS NOT NULL ORDER BY id LIMIT 25`
    );
    console.log("\nSample usernames now:");
    check.rows.forEach(r => console.log(`  ${r.usn} → ${r.username}`));
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error("❌", err.message);
  process.exit(1);
});
