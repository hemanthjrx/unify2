import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const communities = [
  // Social & Community Clubs
  { name: "Community Service Club", slug: "community-service-club", description: "Focuses on volunteering, social work, and community upliftment.", accent: "#22c55e", tags: ["volunteering", "social-work", "community"] },
  { name: "Social Impact Group", slug: "social-impact-group", description: "Works on real-world problems and social initiatives.", accent: "#16a34a", tags: ["social-impact", "initiatives", "changemakers"] },
  { name: "Youth Leadership Corps", slug: "youth-leadership-corps", description: "Develops leadership, discipline, and teamwork skills.", accent: "#15803d", tags: ["leadership", "teamwork", "discipline"] },
  { name: "Civic Engagement Club", slug: "civic-engagement-club", description: "Encourages public service and civic responsibility.", accent: "#14532d", tags: ["civic", "public-service", "responsibility"] },
  { name: "Startup & Innovation Hub", slug: "startup-innovation-hub", description: "Promotes entrepreneurship and startup culture.", accent: "#f59e0b", tags: ["startup", "entrepreneurship", "innovation"] },
  { name: "Adventure & Trekking Club", slug: "adventure-trekking-club", description: "Organizes treks, trips, and outdoor activities.", accent: "#84cc16", tags: ["trekking", "outdoors", "adventure"] },
  { name: "Creative Media Studio", slug: "creative-media-studio", description: "Focuses on content creation, design, and storytelling.", accent: "#ec4899", tags: ["content", "design", "storytelling"] },
  { name: "Communication & Public Speaking Club", slug: "communication-public-speaking", description: "Improves speaking, presentation, and communication skills.", accent: "#06b6d4", tags: ["public-speaking", "communication", "presentations"] },

  // Technical & Engineering Communities
  { name: "Robotics Club", slug: "robotics-club", description: "Builds and programs robots for competitions and projects.", accent: "#3b82f6", tags: ["robotics", "programming", "competitions"] },
  { name: "Autonomous Systems Team", slug: "autonomous-systems-team", description: "Works on intelligent and self-operating systems.", accent: "#2563eb", tags: ["autonomous", "AI", "systems"] },
  { name: "Formula Racing Team", slug: "formula-racing-team", description: "Designs and builds formula-style race cars.", accent: "#ef4444", tags: ["racing", "formula", "engineering"] },
  { name: "Solar Mobility Team", slug: "solar-mobility-team", description: "Develops solar-powered vehicles and energy solutions.", accent: "#eab308", tags: ["solar", "electric", "mobility"] },
  { name: "Space & Satellite Tech Club", slug: "space-satellite-tech", description: "Explores space technology and satellite systems.", accent: "#6366f1", tags: ["space", "satellites", "aerospace"] },
  { name: "Drone & UAV Club", slug: "drone-uav-club", description: "Designs and develops drones and aerial systems.", accent: "#0ea5e9", tags: ["drones", "UAV", "aerial"] },
  { name: "Aerospace Innovation Group", slug: "aerospace-innovation-group", description: "Focuses on aviation and aerospace projects.", accent: "#8b5cf6", tags: ["aerospace", "aviation", "innovation"] },
  { name: "Mechanical Racing Team", slug: "mechanical-racing-team", description: "Works on performance vehicles and racing technology.", accent: "#dc2626", tags: ["mechanical", "racing", "performance"] },
  { name: "Sustainable Energy Team", slug: "sustainable-energy-team", description: "Builds projects related to renewable and sustainable energy.", accent: "#10b981", tags: ["renewable", "sustainability", "energy"] },

  // Cultural, Arts & Creative Clubs
  { name: "Cubing Club", slug: "cubing-club", description: "Focuses on solving Rubik's cubes and speedcubing techniques.", accent: "#f97316", tags: ["cubing", "speedcubing", "puzzles"] },
  { name: "Photography Club", slug: "photography-club", description: "Covers photography skills, editing, and visual storytelling.", accent: "#a855f7", tags: ["photography", "editing", "visual-arts"] },
  { name: "Theatre & Drama Club", slug: "theatre-drama-club", description: "Engages in acting, stage plays, and performances.", accent: "#d946ef", tags: ["theatre", "drama", "acting"] },
  { name: "Fine Arts Club", slug: "fine-arts-club", description: "Focuses on drawing, painting, and creative expression.", accent: "#e879f9", tags: ["painting", "drawing", "fine-arts"] },
  { name: "Videography Club", slug: "videography-club", description: "Creates films, edits videos, and produces content.", accent: "#c026d3", tags: ["video", "filmmaking", "editing"] },
  { name: "Literary & Language Club", slug: "literary-language-club", description: "Promotes writing, reading, and language skills.", accent: "#7c3aed", tags: ["writing", "literature", "language"] },
  { name: "Performing Arts Club", slug: "performing-arts-club", description: "Covers dance, stage performances, and cultural acts.", accent: "#9333ea", tags: ["dance", "performance", "cultural"] },
  { name: "Music Society", slug: "music-society", description: "Focuses on singing, instruments, and musical performances.", accent: "#6d28d9", tags: ["music", "singing", "instruments"] },
  { name: "Debate Club", slug: "debate-club", description: "Enhances debating, argumentation, and critical thinking.", accent: "#4f46e5", tags: ["debate", "argumentation", "critical-thinking"] },
  { name: "Quiz Club", slug: "quiz-club", description: "Organizes quizzes and knowledge-based competitions.", accent: "#0284c7", tags: ["quiz", "knowledge", "competitions"] },
  { name: "Cultural Events Club", slug: "cultural-events-club", description: "Manages and organizes cultural events and fests.", accent: "#be185d", tags: ["cultural", "events", "fests"] },

  // Tech, Career & Skill-Based Clubs
  { name: "Programming Club", slug: "programming-club", description: "Focuses on coding, problem-solving, and software development.", accent: "#059669", tags: ["coding", "programming", "development"] },
  { name: "AI & Machine Learning Club", slug: "ai-ml-club", description: "Works on AI models, data science, and intelligent systems.", accent: "#7c5cff", tags: ["AI", "machine-learning", "data-science"] },
  { name: "Cybersecurity Club", slug: "cybersecurity-club", description: "Explores ethical hacking, security concepts, and CTFs.", accent: "#b91c1c", tags: ["cybersecurity", "ethical-hacking", "CTF"] },
  { name: "Web Development Club", slug: "web-development-club", description: "Builds websites and full-stack web applications.", accent: "#0369a1", tags: ["web", "frontend", "backend"] },
  { name: "Entrepreneurship Club", slug: "entrepreneurship-club", description: "Encourages business ideas, pitching, and startup execution.", accent: "#d97706", tags: ["entrepreneurship", "business", "startup"] },
  { name: "Finance & Investment Club", slug: "finance-investment-club", description: "Teaches financial literacy, investing, and market analysis.", accent: "#15803d", tags: ["finance", "investing", "literacy"] },
  { name: "Marketing Club", slug: "marketing-club", description: "Focuses on branding, digital promotion, and marketing strategy.", accent: "#db2777", tags: ["marketing", "branding", "strategy"] },
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Remove all existing community members and communities
    await client.query("DELETE FROM community_members");
    await client.query("DELETE FROM communities");

    // Insert new communities
    for (const c of communities) {
      await client.query(
        `INSERT INTO communities (slug, name, description, accent_color, tags)
         VALUES ($1, $2, $3, $4, $5)`,
        [c.slug, c.name, c.description, c.accent, c.tags]
      );
    }

    await client.query("COMMIT");
    console.log(`Seeded ${communities.length} communities successfully.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
