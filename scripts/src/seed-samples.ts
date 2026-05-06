import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const userIds = [18, 19, 20, 21, 22, 23, 24, 25]; // priya, arjun, ananya, vikram, karan, ishika, ravi, meera

function pick(arr: number[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  const client = await pool.connect();
  try {
    // ── 5 Marketplace Products ─────────────────────────────────────────────
    const products = [
      {
        seller_id: pick(userIds),
        title: "HP 15s Laptop — i5 11th Gen, 16GB RAM",
        description:
          "Selling my HP 15s used for 1 year. Perfect condition, no scratches, battery backup 5–6 hrs. Comes with original charger and box. Reason: upgrading to MacBook. Ideal for coding, college work.",
        price: "28000.00",
        category: "electronics",
        contact_info: "DM on Unify or WhatsApp 9876543210",
      },
      {
        seller_id: pick(userIds),
        title: "Engineering Mathematics (M1 + M2) Textbooks",
        description:
          "VTU syllabus Engineering Maths books by B.S. Grewal (44th edition) and H.K. Dass. Both in excellent condition, minimal highlighting. Perfect for 1st and 2nd semester students.",
        price: "350.00",
        category: "books",
        contact_info: "Meet on campus — hostel block C, room 214",
      },
      {
        seller_id: pick(userIds),
        title: "Mechanical Keyboard — Keychron K2 (Red switches)",
        description:
          "Barely used Keychron K2 TKL mechanical keyboard with red linear switches. Wireless + wired. Great for coding. Selling because I switched to a 65% layout. No scratches, all keys work.",
        price: "4200.00",
        category: "electronics",
        contact_info: "Cash or UPI. Contact via Unify messages.",
      },
      {
        seller_id: pick(userIds),
        title: "Adobe Creative Cloud 1-Year License (Student)",
        description:
          "Transferable 1-year Adobe CC student plan subscription — includes Photoshop, Illustrator, Premiere Pro. Purchased via college deal. 8 months remaining. Original receipt available.",
        price: "1800.00",
        category: "software",
        contact_info: "Message me here to arrange transfer",
      },
      {
        seller_id: pick(userIds),
        title: "Bicycle — Firefox Rapide 21-speed",
        description:
          "21-speed Firefox Rapide mountain bike, sky blue, bought 2 years ago for ₹9500. Serviced 3 months ago, new tyres, all gears working. Ideal for college commute or weekend rides.",
        price: "5500.00",
        category: "other",
        contact_info: "Available weekends near main gate. DM to schedule.",
      },
    ];

    for (const p of products) {
      await client.query(
        `INSERT INTO marketplace_products (seller_id, title, description, price, category, contact_info, images)
         VALUES ($1, $2, $3, $4, $5, $6, '{}')`,
        [p.seller_id, p.title, p.description, p.price, p.category, p.contact_info],
      );
    }
    console.log(`✅ Inserted ${products.length} marketplace products`);

    // ── 5 Freelance Services ───────────────────────────────────────────────
    const services = [
      {
        provider_id: pick(userIds),
        title: "Full-Stack Web App Development (React + Node)",
        description:
          "I build responsive web applications using React, Node.js, Express, and PostgreSQL. Have completed 3 college mini-projects and 2 client projects. Includes REST API, auth, deployment on Vercel/Render. Share your requirements and I'll give a custom quote.",
        price: "3500.00",
        category: "development",
        delivery_days: 10,
        contact_info: "Message me on Unify for a free consultation",
      },
      {
        provider_id: pick(userIds),
        title: "UI/UX Design — Figma Mockups & Prototypes",
        description:
          "I design clean, modern UI mockups and interactive Figma prototypes for mobile apps and websites. Skilled in design systems, wireframes, and user flows. Turnaround: 5–7 days for a full design. Previous work available on request.",
        price: "1500.00",
        category: "design",
        delivery_days: 6,
        contact_info: "DM with your project brief",
      },
      {
        provider_id: pick(userIds),
        title: "Machine Learning Model Training & Integration",
        description:
          "Experienced in Python ML/DL (scikit-learn, TensorFlow, PyTorch). I can build classifiers, regression models, or basic NLP pipelines. Also help integrate models into Flask/FastAPI backends. Good for college capstone projects.",
        price: "2500.00",
        category: "development",
        delivery_days: 14,
        contact_info: "Reach out via Unify messages with dataset details",
      },
      {
        provider_id: pick(userIds),
        title: "Technical Content Writing & Blog Posts",
        description:
          "I write well-researched, plagiarism-free technical articles, blog posts, and documentation. Topics: web dev, cloud, AI, open source. 500–1500 words per article. Delivered in Google Docs or Markdown. Ideal for dev blogs or LinkedIn posts.",
        price: "400.00",
        category: "writing",
        delivery_days: 3,
        contact_info: "Message with topic and word count",
      },
      {
        provider_id: pick(userIds),
        title: "Android App Development (Java / Kotlin)",
        description:
          "I develop Android apps from scratch — Firebase integration, REST APIs, Google Maps, notifications. Have published 1 app on Play Store. Provide full source code + APK. Perfect for college projects requiring a working Android demo.",
        price: "4000.00",
        category: "development",
        delivery_days: 12,
        contact_info: "WhatsApp 9845012345 or DM here",
      },
    ];

    for (const s of services) {
      await client.query(
        `INSERT INTO freelance_services (provider_id, title, description, price, category, delivery_days, contact_info, images)
         VALUES ($1, $2, $3, $4, $5, $6, $7, '{}')`,
        [s.provider_id, s.title, s.description, s.price, s.category, s.delivery_days, s.contact_info],
      );
    }
    console.log(`✅ Inserted ${services.length} freelance services`);

    // ── 5 Regular Posts ────────────────────────────────────────────────────
    const posts = [
      {
        author_id: pick(userIds),
        body: "Just submitted my first open-source PR! Fixed a bug in a React UI library — took me 3 days to understand the codebase but so worth it. If you want to start contributing to OSS, start with 'good first issue' labels on GitHub 🚀",
      },
      {
        author_id: pick(userIds),
        body: "Hot take: reading documentation properly saves 10x more time than Stack Overflow hopping. Spent an hour on a CORS issue last week — turns out the Express docs had the exact config I needed. RTFM is underrated 📖",
      },
      {
        author_id: pick(userIds),
        body: "Finished my 30-day DSA streak today! Solved 30 problems on LeetCode — mostly arrays, strings, and some trees. Started understanding patterns now instead of memorizing solutions. The grind pays off 💪 Who else is doing the daily challenge?",
      },
      {
        author_id: pick(userIds),
        body: "Looking for study partners for GATE 2026 prep (CS). Planning to cover Algorithms, OS, DBMS, and CN systematically. Will share notes and weekly mock tests. DM if interested — the more the merrier! 📚",
      },
      {
        author_id: pick(userIds),
        body: "Deployed my first full-stack project to production today — a college event management system built with Next.js + Supabase. It's live, people are using it, and nothing has crashed yet 😅 Small wins matter. Keep building!",
      },
    ];

    for (const p of posts) {
      await client.query(
        `INSERT INTO posts (author_id, body, kind) VALUES ($1, $2, 'post')`,
        [p.author_id, p.body],
      );
    }
    console.log(`✅ Inserted ${posts.length} sample posts`);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
