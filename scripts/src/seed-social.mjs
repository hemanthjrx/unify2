/**
 * Seed script: fake messages, notifications, follows for all users
 * Run: node scripts/src/seed-social.mjs
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { Pool } = require(path.resolve(__dirname, "../../node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js"));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pick(arr, n) { return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length)); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function hoursAgo(h) { return new Date(Date.now() - h * 3600_000); }

// ─── Fake message templates ─────────────────────────────────────────────────
const GREETINGS = [
  "Hey! I saw your profile and thought we should connect.",
  "Hi! Are you also joining the hackathon this weekend?",
  "Hey, saw you're in the same branch. Which semester are you in?",
  "Yo! Your freelance profile looks solid. Do you take custom projects?",
  "Hi there! I noticed we share the same interests. Want to collaborate sometime?",
  "Hey! I'm looking for teammates for SIH. Interested?",
  "Hello! Saw your marketplace listing. Is it still available?",
  "Hi! I'm also in the web dev community. Let's connect!",
  "Hey, are you attending the tech fest next month?",
  "Hi! Your mentorship reply really helped me. Thanks a lot!",
];

const REPLIES = [
  "Hey! Thanks for reaching out. Yeah, definitely interested!",
  "Sure, I'd love to collaborate. What do you have in mind?",
  "Of course! DM me your details and we can discuss.",
  "Sounds great! When are you free to chat?",
  "Yes, it's still available! When can you pick it up?",
  "Absolutely, let's connect. I'm free this weekend.",
  "Thanks! I'd love to join the hackathon team.",
  "That would be awesome. I've been looking for teammates too.",
  "Yes! I'm in 6th semester. Which electives did you choose?",
  "Cool! I'm working on a similar project. Would love some input.",
];

const FOLLOW_UPS = [
  "Cool, let's meet at the library tomorrow around 4 PM?",
  "I'll share the project details on the community chat.",
  "Looking forward to building together!",
  "Let me know if you need any help with the backend side.",
  "I'll send you my GitHub link so you can check out my previous work.",
  "Great, let's do a video call on Friday?",
  "I can help with the ML part. What's the deadline?",
  "Perfect! I'll drop you my contact info.",
  "Awesome, add me on LinkedIn too: let's stay in touch.",
  "Sure, I'll bring my laptop. See you around!",
];

const SECOND_REPLIES = [
  "Sounds like a plan! See you then.",
  "That works for me. Looking forward to it!",
  "Perfect. I'll be there.",
  "Sent you the GitHub link. Let me know what you think.",
  "Friday works! I'll set up a meet link.",
  "Great! I'll get started on the frontend.",
  "Cool, I'll share the dataset with you.",
  "Perfect, see you around!",
  "Thanks again for the help. Really appreciate it.",
  "Will do! Excited to work together.",
];

// ─── Notification type templates ─────────────────────────────────────────────
const NOTIFICATION_TYPES = ["follow", "like", "comment", "follow_request"];

// ─── Get all user IDs ─────────────────────────────────────────────────────────
const { rows: userRows } = await pool.query(
  "SELECT id, username FROM users WHERE onboarding_complete = true ORDER BY id"
);
const users = userRows;
const userIds = users.map(u => u.id);

console.log(`Found ${users.length} users. Seeding social data...`);

// ─── 1. FOLLOWS ──────────────────────────────────────────────────────────────
console.log("\n[1/3] Creating follows...");
let followCount = 0;

for (const userId of userIds) {
  // Each user follows 15-30 others
  const toFollow = pick(userIds.filter(id => id !== userId), randInt(15, 30));
  for (const followeeId of toFollow) {
    try {
      await pool.query(
        `INSERT INTO follows (follower_id, followee_id, status, created_at)
         VALUES ($1, $2, 'accepted', $3)
         ON CONFLICT DO NOTHING`,
        [userId, followeeId, hoursAgo(randInt(10, 720))]
      );
      followCount++;
    } catch { /* skip */ }
  }
}
console.log(`  ✓ ${followCount} follow relationships created`);

// ─── 2. MESSAGES ─────────────────────────────────────────────────────────────
console.log("\n[2/3] Creating messages...");
let msgCount = 0;
const conversationsDone = new Set();

for (const user of users) {
  // Each user has 4-8 conversations
  const partners = pick(users.filter(u => u.id !== user.id), randInt(4, 8));

  for (const partner of partners) {
    const pairKey = [user.id, partner.id].sort().join("-");
    if (conversationsDone.has(pairKey)) continue;
    conversationsDone.add(pairKey);

    // Build a short conversation: greeting → reply → follow-up → second reply
    const msgCount_inner = randInt(3, 6);
    const participants = [user, partner];
    let speaker = rand([0, 1]); // who starts

    const templates = [
      rand(GREETINGS),
      rand(REPLIES),
      rand(FOLLOW_UPS),
      rand(SECOND_REPLIES),
      rand(FOLLOW_UPS),
      rand(SECOND_REPLIES),
    ];

    for (let i = 0; i < msgCount_inner && i < templates.length; i++) {
      const senderId = participants[speaker % 2].id;
      const recipientId = participants[(speaker + 1) % 2].id;
      const hoursBack = (msgCount_inner - i) * randInt(1, 8) + randInt(0, 24);
      const isRead = i < msgCount_inner - 1; // last message unread

      await pool.query(
        `INSERT INTO messages (sender_id, recipient_id, body, kind, read, created_at)
         VALUES ($1, $2, $3, 'text', $4, $5)`,
        [senderId, recipientId, templates[i], isRead, hoursAgo(hoursBack)]
      );
      msgCount++;
      speaker++;
    }
  }
}
console.log(`  ✓ ${msgCount} messages across ${conversationsDone.size} conversations`);

// ─── 3. NOTIFICATIONS ────────────────────────────────────────────────────────
console.log("\n[3/3] Creating notifications...");
let notifCount = 0;

// Get existing post IDs for "like" notifications
const { rows: postRows } = await pool.query("SELECT id, author_id FROM posts LIMIT 200");
const posts = postRows;

for (const user of users) {
  const others = users.filter(u => u.id !== user.id);

  // 5-12 follow notifications
  const followers = pick(others, randInt(5, 12));
  for (const actor of followers) {
    try {
      await pool.query(
        `INSERT INTO notifications (recipient_id, actor_id, type, read, created_at)
         VALUES ($1, $2, 'follow', $3, $4)`,
        [user.id, actor.id, Math.random() > 0.4, hoursAgo(randInt(1, 500))]
      );
      notifCount++;
    } catch { /* skip */ }
  }

  // 3-8 like notifications on own posts (if user has posts)
  const ownPosts = posts.filter(p => p.author_id === user.id);
  if (ownPosts.length > 0) {
    const likers = pick(others, randInt(3, 8));
    for (const actor of likers) {
      const post = rand(ownPosts);
      try {
        await pool.query(
          `INSERT INTO notifications (recipient_id, actor_id, type, post_id, read, created_at)
           VALUES ($1, $2, 'like', $3, $4, $5)`,
          [user.id, actor.id, post.id, Math.random() > 0.5, hoursAgo(randInt(1, 300))]
        );
        notifCount++;
      } catch { /* skip */ }
    }
  }

  // 2-5 follow_request notifications
  const requesters = pick(others, randInt(2, 5));
  for (const actor of requesters) {
    try {
      await pool.query(
        `INSERT INTO notifications (recipient_id, actor_id, type, read, created_at)
         VALUES ($1, $2, 'follow_request', $3, $4)`,
        [user.id, actor.id, false, hoursAgo(randInt(1, 100))]
      );
      notifCount++;
    } catch { /* skip */ }
  }
}
console.log(`  ✓ ${notifCount} notifications created`);

await pool.end();

console.log("\n✅ Social seed complete!");
console.log(`   Follows: ${followCount}`);
console.log(`   Messages: ${msgCount} in ${conversationsDone.size} conversations`);
console.log(`   Notifications: ${notifCount}`);
