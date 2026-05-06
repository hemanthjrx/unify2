import {
  db,
  pool,
  interestsTable,
  communitiesTable,
  usersTable,
  userInterestsTable,
  communityMembersTable,
  followsTable,
  activityTable,
  postsTable,
  postLikesTable,
  notificationsTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

const INTERESTS = [
  // Tech
  { name: "Web Development", category: "Tech", emoji: "🌐" },
  { name: "Mobile Development", category: "Tech", emoji: "📱" },
  { name: "Machine Learning", category: "Tech", emoji: "🤖" },
  { name: "Data Science", category: "Tech", emoji: "📊" },
  { name: "Cybersecurity", category: "Tech", emoji: "🔒" },
  { name: "Game Development", category: "Tech", emoji: "🎮" },
  { name: "Cloud / DevOps", category: "Tech", emoji: "☁️" },
  { name: "Blockchain", category: "Tech", emoji: "⛓️" },
  // Design
  { name: "UI/UX Design", category: "Design", emoji: "🎨" },
  { name: "3D / Motion", category: "Design", emoji: "✨" },
  { name: "Illustration", category: "Design", emoji: "🖌️" },
  { name: "Product Design", category: "Design", emoji: "📐" },
  // Academic
  { name: "Mathematics", category: "Academic", emoji: "➗" },
  { name: "Physics", category: "Academic", emoji: "⚛️" },
  { name: "Biology", category: "Academic", emoji: "🧬" },
  { name: "Chemistry", category: "Academic", emoji: "⚗️" },
  { name: "Literature", category: "Academic", emoji: "📚" },
  { name: "History", category: "Academic", emoji: "🏛️" },
  // Career
  { name: "Startups", category: "Career", emoji: "🚀" },
  { name: "Internships", category: "Career", emoji: "💼" },
  { name: "Research", category: "Career", emoji: "🔬" },
  { name: "Finance", category: "Career", emoji: "💸" },
  // Lifestyle
  { name: "Music Production", category: "Creative", emoji: "🎧" },
  { name: "Photography", category: "Creative", emoji: "📷" },
  { name: "Writing", category: "Creative", emoji: "✍️" },
  { name: "Esports", category: "Lifestyle", emoji: "🕹️" },
];

const COMMUNITIES = [
  {
    slug: "frontend-builders",
    name: "Frontend Builders",
    description: "Component design, animations, and shipping pixel-perfect UIs.",
    accentColor: "#7c5cff",
    tags: ["Web Development", "UI/UX Design", "Product Design"],
  },
  {
    slug: "ml-lab",
    name: "ML Lab",
    description: "Paper readings, kaggle pushes, and weekend training runs.",
    accentColor: "#22d3ee",
    tags: ["Machine Learning", "Data Science", "Research"],
  },
  {
    slug: "indie-game-dev",
    name: "Indie Game Dev",
    description: "Pixel art, game jams, and Unity/Godot shipping cohorts.",
    accentColor: "#f472b6",
    tags: ["Game Development", "3D / Motion", "Illustration"],
  },
  {
    slug: "study-grind",
    name: "Study Grind",
    description: "Pomodoro sessions, flashcards, and STEM exam prep.",
    accentColor: "#34d399",
    tags: ["Mathematics", "Physics", "Chemistry", "Biology"],
  },
  {
    slug: "founders-circle",
    name: "Founders Circle",
    description: "Pitch nights, MVP feedback, and connecting with first hires.",
    accentColor: "#fb923c",
    tags: ["Startups", "Internships", "Finance"],
  },
  {
    slug: "creative-corner",
    name: "Creative Corner",
    description: "Music drops, photo critiques, and weekly writing prompts.",
    accentColor: "#facc15",
    tags: ["Music Production", "Photography", "Writing"],
  },
  {
    slug: "cyber-guild",
    name: "Cyber Guild",
    description: "CTFs, hardening labs, and bug bounty walkthroughs.",
    accentColor: "#a78bfa",
    tags: ["Cybersecurity", "Cloud / DevOps", "Blockchain"],
  },
  {
    slug: "design-studio",
    name: "Design Studio",
    description: "Daily UI prompts, portfolio reviews, and motion experiments.",
    accentColor: "#f87171",
    tags: ["UI/UX Design", "3D / Motion", "Illustration", "Product Design"],
  },
];

const SAMPLE_USERS = [
  {
    clerkUserId: "seed_priya",
    username: "priya",
    bio: "CS final year shipping a study OS. ML + DX nerd from Bengaluru.",
    avatarColor: "#7c5cff",
    coins: 480,
    weeklyPoints: 65,
    skills: ["TypeScript", "React", "PyTorch"],
    interests: ["Web Development", "Machine Learning", "UI/UX Design"],
    communities: ["frontend-builders", "ml-lab"],
  },
  {
    clerkUserId: "seed_arjun",
    username: "arjun",
    bio: "Game jam veteran and pixel-art obsessive. Unity + Godot.",
    avatarColor: "#f472b6",
    coins: 410,
    weeklyPoints: 48,
    skills: ["Unity", "C#", "Aseprite"],
    interests: ["Game Development", "Illustration", "3D / Motion"],
    communities: ["indie-game-dev", "creative-corner"],
  },
  {
    clerkUserId: "seed_ananya",
    username: "ananya",
    bio: "Pre-med at AIIMS. Neuro labs and flashcard maxxing since day 1.",
    avatarColor: "#34d399",
    coins: 360,
    weeklyPoints: 52,
    skills: ["Anki", "Lab notebook", "R"],
    interests: ["Biology", "Chemistry", "Research"],
    communities: ["study-grind", "ml-lab"],
  },
  {
    clerkUserId: "seed_vikram",
    username: "vikram",
    bio: "Building a fintech for students. IIT Bombay dropout energy.",
    avatarColor: "#fb923c",
    coins: 545,
    weeklyPoints: 81,
    skills: ["Next.js", "Stripe", "Pitch decks"],
    interests: ["Startups", "Finance", "Web Development"],
    communities: ["founders-circle", "frontend-builders"],
  },
  {
    clerkUserId: "seed_karan",
    username: "karan",
    bio: "CTF grinder from Pune. Bug bounties pay for chai and ramen.",
    avatarColor: "#a78bfa",
    coins: 290,
    weeklyPoints: 30,
    skills: ["Burp Suite", "Python", "Reversing"],
    interests: ["Cybersecurity", "Cloud / DevOps"],
    communities: ["cyber-guild"],
  },
  {
    clerkUserId: "seed_ishika",
    username: "ishika",
    bio: "Designs by day, lo-fi and tabla by night. Delhi-based.",
    avatarColor: "#facc15",
    coins: 320,
    weeklyPoints: 41,
    skills: ["Figma", "After Effects", "Ableton"],
    interests: ["UI/UX Design", "Music Production", "3D / Motion"],
    communities: ["design-studio", "creative-corner"],
  },
  {
    clerkUserId: "seed_ravi",
    username: "ravi",
    bio: "Maths major, Chennai. Loves a good proof and a worse pun.",
    avatarColor: "#22d3ee",
    coins: 215,
    weeklyPoints: 22,
    skills: ["LaTeX", "Coq", "Sage"],
    interests: ["Mathematics", "Physics", "Research"],
    communities: ["study-grind"],
  },
  {
    clerkUserId: "seed_meera",
    username: "meera",
    bio: "Photographer chasing golden hour in Mumbai.",
    avatarColor: "#f87171",
    coins: 180,
    weeklyPoints: 18,
    skills: ["Lightroom", "Sony A7", "Color theory"],
    interests: ["Photography", "Writing", "Illustration"],
    communities: ["creative-corner", "design-studio"],
  },
];

const POSTS_SEED: Array<{
  author: string;
  community?: string;
  body: string;
  likedBy?: string[];
}> = [
  {
    author: "priya",
    community: "frontend-builders",
    body: "Just shipped a Tailwind variant of the new dashboard. The shadcn primitives + framer-motion combo is unreal for prototyping.",
    likedBy: ["vikram", "ishika"],
  },
  {
    author: "vikram",
    community: "founders-circle",
    body: "Hosting a weekend hackathon in Bengaluru — building a finance copilot for college students. DM if you want in, looking for 1 designer + 1 backend dev.",
    likedBy: ["priya", "karan", "ravi"],
  },
  {
    author: "arjun",
    community: "indie-game-dev",
    body: "Pixel-art brushes for Aseprite are now in the shared drive. Tested with the new platformer prototype 👀",
    likedBy: ["ishika", "meera"],
  },
  {
    author: "ananya",
    community: "study-grind",
    body: "50-day Anki streak unlocked. Pro tip: schedule your reviews BEFORE chai, not after.",
    likedBy: ["ravi"],
  },
  {
    author: "ishika",
    community: "design-studio",
    body: "Daily UI day 12 — a dark-mode music player. Tried a duotone gradient on the album art and I'm into it.",
    likedBy: ["meera", "priya", "arjun"],
  },
  {
    author: "karan",
    community: "cyber-guild",
    body: "Wrote up my path through last week's CTF box. Wild blind XSS chain at the end. Link in the resources channel.",
    likedBy: ["vikram"],
  },
  {
    author: "ravi",
    body: "Finally cracked that combinatorics proof for problem set 4. Chai count: 3.",
    likedBy: ["ananya"],
  },
  {
    author: "meera",
    community: "creative-corner",
    body: "Golden hour shoot from Marine Drive tonight. Edit pack going up later 📷",
    likedBy: ["ishika"],
  },
  {
    author: "priya",
    community: "ml-lab",
    body: "Anyone else reading the new RoPE scaling paper? Wild that you can extend context this cleanly.",
    likedBy: ["ananya", "vikram"],
  },
  {
    author: "vikram",
    body: "Reminder: pitch night next Thursday at the BITS Pilani incubator. Bring your roughest deck — we'll tear it apart with love.",
    likedBy: ["priya"],
  },
];

const ACTIVITY_SEED = [
  { actor: "priya", kind: "post", message: "shared a Tailwind animation snippet" },
  { actor: "vikram", kind: "hackathon", message: "is hosting a weekend hackathon in Bengaluru", target: "Founders Circle" },
  { actor: "arjun", kind: "resource", message: "uploaded pixel-art brushes for Aseprite" },
  { actor: "ananya", kind: "badge", message: "earned the 50-day streak badge" },
  { actor: "ishika", kind: "community_join", message: "joined Design Studio", target: "Design Studio" },
  { actor: "karan", kind: "post", message: "wrote a writeup on a recent CTF challenge" },
];

async function main() {
  console.log("Seeding interests…");
  await db.execute(sql`truncate ${notificationsTable} restart identity cascade`);
  await db.execute(sql`truncate ${postLikesTable} cascade`);
  await db.execute(sql`truncate ${postsTable} restart identity cascade`);
  await db.execute(sql`truncate ${activityTable} restart identity cascade`);
  await db.execute(sql`truncate ${followsTable} cascade`);
  await db.execute(sql`truncate ${communityMembersTable} cascade`);
  await db.execute(sql`truncate ${userInterestsTable} cascade`);
  await db.execute(sql`truncate ${communitiesTable} restart identity cascade`);
  await db.execute(sql`truncate ${interestsTable} restart identity cascade`);
  await db.execute(sql`delete from ${usersTable} where ${usersTable.clerkUserId} like 'seed_%'`);

  const insertedInterests = await db.insert(interestsTable).values(INTERESTS).returning();
  const interestByName = new Map(insertedInterests.map((i) => [i.name, i.id]));

  console.log("Seeding communities…");
  const insertedCommunities = await db.insert(communitiesTable).values(COMMUNITIES).returning();
  const communityBySlug = new Map(insertedCommunities.map((c) => [c.slug, c.id]));

  console.log("Seeding sample users…");
  for (const u of SAMPLE_USERS) {
    const [user] = await db
      .insert(usersTable)
      .values({
        clerkUserId: u.clerkUserId,
        username: u.username,
        bio: u.bio,
        avatarColor: u.avatarColor,
        coins: u.coins,
        weeklyPoints: u.weeklyPoints,
        skills: u.skills,
        onboardingComplete: true,
      })
      .returning();

    const interestIds = u.interests
      .map((n) => interestByName.get(n))
      .filter((v): v is number => typeof v === "number");
    if (interestIds.length > 0) {
      await db
        .insert(userInterestsTable)
        .values(interestIds.map((interestId) => ({ userId: user.id, interestId })));
    }

    const communityIds = u.communities
      .map((slug) => communityBySlug.get(slug))
      .filter((v): v is number => typeof v === "number");
    if (communityIds.length > 0) {
      await db
        .insert(communityMembersTable)
        .values(communityIds.map((cid) => ({ userId: user.id, communityId: cid })));
    }
  }

  // Create some sample follows between seed users
  const seedUsers = await db.select().from(usersTable);
  const usersByName = new Map(seedUsers.filter((u) => u.username).map((u) => [u.username!, u.id]));
  const followPairs: Array<[string, string]> = [
    ["priya", "vikram"],
    ["priya", "arjun"],
    ["vikram", "priya"],
    ["arjun", "ishika"],
    ["ishika", "arjun"],
    ["ananya", "ravi"],
    ["ravi", "ananya"],
    ["karan", "vikram"],
    ["meera", "ishika"],
    ["ishika", "meera"],
  ];
  for (const [a, b] of followPairs) {
    const followerId = usersByName.get(a);
    const followeeId = usersByName.get(b);
    if (followerId && followeeId) {
      await db
        .insert(followsTable)
        .values({ followerId, followeeId })
        .onConflictDoNothing();
    }
  }

  console.log("Seeding posts…");
  const communitiesBySlugAll = new Map(
    insertedCommunities.map((c) => [c.slug, c.id]),
  );
  for (const p of POSTS_SEED) {
    const authorId = usersByName.get(p.author);
    if (!authorId) continue;
    const communityId = p.community ? communitiesBySlugAll.get(p.community) ?? null : null;
    const [created] = await db
      .insert(postsTable)
      .values({ authorId, communityId, body: p.body })
      .returning();
    if (p.likedBy && p.likedBy.length > 0) {
      const likeRows = p.likedBy
        .map((u) => usersByName.get(u))
        .filter((v): v is number => typeof v === "number")
        .map((userId) => ({ postId: created.id, userId }));
      if (likeRows.length > 0) {
        await db.insert(postLikesTable).values(likeRows).onConflictDoNothing();
      }
    }
  }

  console.log("Seeding activity feed…");
  for (const a of ACTIVITY_SEED) {
    const actorId = usersByName.get(a.actor);
    if (!actorId) continue;
    await db.insert(activityTable).values({
      actorId,
      kind: a.kind,
      message: a.message,
      targetName: a.target ?? null,
    });
  }

  console.log("Done.");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
