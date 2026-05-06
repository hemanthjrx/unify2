import pg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const BRANCHES = ["CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL", "AIML", "DS"];
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];
const AVATAR_COLORS = [
  "#7c5cff", "#e85d75", "#3b82f6", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4",
];

const FIRST_NAMES = [
  "Aarav", "Aditi", "Aditya", "Akash", "Ananya", "Anjali", "Ankit", "Anu",
  "Arjun", "Aryan", "Bhavya", "Chaitanya", "Deepak", "Divya", "Farhan",
  "Gauri", "Harshit", "Ishaan", "Ishika", "Jaya", "Karan", "Kavya",
  "Keerthi", "Kriti", "Lakshmi", "Manish", "Meera", "Mihir", "Mohit",
  "Nandini", "Nikhil", "Nisha", "Piyush", "Pooja", "Pranjal", "Priya",
  "Rahul", "Rajan", "Rakesh", "Rashmi", "Ravi", "Rohit", "Sahil",
  "Sakshi", "Sameer", "Sandeep", "Shikha", "Shivam", "Shruti", "Siddharth",
  "Sneha", "Soumya", "Suresh", "Tanvi", "Tushar", "Uday", "Varun",
  "Vidya", "Vikram", "Vishal", "Yash", "Yashika", "Zoya",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Gupta", "Singh", "Kumar", "Joshi", "Mehta",
  "Reddy", "Nair", "Iyer", "Pillai", "Das", "Bose", "Rao", "Shetty",
  "Menon", "Choudhary", "Tiwari", "Jain", "Agarwal", "Mishra", "Pandey",
  "Shah", "Desai",
];

const COMMUNITY_POSTS: string[] = [
  "Anyone else excited about the upcoming hackathon? Let's team up!",
  "Just finished implementing binary search trees in C++. Happy to help if anyone is stuck.",
  "We're organizing a study group for Data Structures this weekend. DM me if interested.",
  "Shared notes from today's lecture on operating systems. Check the drive link in bio.",
  "Looking for teammates for the inter-college coding competition. We need a backend dev.",
  "Anyone has experience with Docker? Need help setting it up for my final year project.",
  "Posted my first GitHub repo for a React portfolio template. Feedback welcome!",
  "Today's algorithm workshop was great. We covered dynamic programming with amazing examples.",
  "Does anyone have the previous year question papers for the Database Management System exam?",
  "Excited to announce our club is hosting a workshop on Machine Learning next Friday!",
  "Just discovered an amazing free resource for learning System Design. Will share in next meeting.",
  "Who's attending the tech fest at BMS College this weekend? Let's carpool.",
  "Our club project for Smart India Hackathon is almost ready. Final demo on Saturday.",
  "If you haven't tried using GitHub Copilot for your projects yet, it's a total game changer.",
  "The semester results are out. Congrats to everyone who cleared their backlogs!",
];

const HACKATHON_POSTS: string[] = [
  "Just registered for HackVerse 5.0 — anyone else going? Need a UI/UX designer.",
  "Our team won 2nd place at TechFusion 2025! So proud of what we built in 24 hours.",
  "Tips for surviving a 48-hour hackathon: caffeine, GitHub branches, and good snacks.",
  "Building a smart waste management system for Smart Cities Hackathon. Looking for IoT devs.",
  "Just submitted our app to the AICTE Innovation Challenge. Fingers crossed!",
  "Pro tip: always have a working demo ready. Judges at hackathons love live demos over slides.",
  "Our team is looking for a data scientist for an upcoming government hackathon.",
  "Hackathon idea: AI-powered attendance system using facial recognition. Thoughts?",
  "Anyone has participated in ETHIndia before? Any advice for blockchain hackathons?",
  "Just got the confirmation email for HackMITR. Super stoked for this one!",
  "For those applying to HackFest 2025 — the deadline is this Sunday. Don't miss it!",
  "Presenting our mental health chatbot project at the Health-Tech Hackathon today.",
  "Quick tip: use Vercel for deploying hackathon projects. Free, fast, and zero config.",
  "Our campus coding challenge is next month. Team registrations are open now!",
  "Won a cash prize of ₹15,000 at InnovatIon Summit. Worth the sleepless nights!",
];

const MARKETPLACE_POST_CONTENT: string[] = [
  "Listing my old textbooks and calculator here. Message me for prices.",
  "Check out the marketplace — I just listed my old laptop for 25k.",
  "Selling my room's AC since I'm moving out. DM if interested before it sells out.",
  "Anyone need lab coats? I have two barely used ones for 150 each.",
  "Just bought a new setup, listing my old monitor and keyboard in marketplace.",
  "Looking to buy a second-hand iPad for college. Budget around 15k. Any leads?",
  "Posted my bicycle in the marketplace. Leaving campus, needs a good home!",
  "Anyone selling Java or Python programming books for 3rd semester?",
  "My neighbor is selling her complete engineering lab kit. Posted in marketplace.",
  "Great deals on calculators in the marketplace right now. Perfect for exams!",
  "Selling my Kindle — too many physical books now. Check the marketplace.",
  "Looking for a good gaming chair for my hostel room. Budget 3–5k. Any suggestions?",
  "URGENT: Selling my HP laptop before leaving to Bangalore for internship. Priced to sell.",
  "Just listed a vintage graphics calculator — collector's item for engineering students.",
  "Anyone has study lamps to sell? Mine broke and exams are next week.",
];

const FREELANCE_POST_CONTENT: string[] = [
  "Just completed a freelance web project for a local startup. So rewarding!",
  "Taking on new freelance clients this semester. I do React + Node dev.",
  "Earned my first ₹5,000 from a Figma design project. Freelancing is real!",
  "Anyone need help with their final year project? I offer affordable dev services.",
  "My content writing service is live in the freelance section. Check it out!",
  "Data entry and Excel automation services available. Message me.",
  "I help with machine learning projects — training models, plotting results, reports.",
  "Photography services for college fests. Check my portfolio in the freelance section.",
  "Video editing starting at ₹500. Quick turnaround for YouTube/Instagram content.",
  "Offering PCB design services for electronics projects. DM for quote.",
  "Just finished tutoring 3 students for their C programming exam. All cleared!",
  "Teaching guitar on weekends. Beginner to intermediate. Online or on-campus.",
  "Full resume and LinkedIn profile optimization service — ₹300 only.",
  "Social media management for small businesses and clubs. 10 posts/month.",
  "Offering translation services from English to Hindi and Kannada for documents.",
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("🌱 Starting seed...\n");

    // ── Fetch existing communities ──────────────────────────────────────────
    const { rows: communities } = await client.query(
      "SELECT id, slug FROM communities ORDER BY id LIMIT 10",
    );
    if (communities.length === 0) {
      console.warn("⚠️  No communities found. Run seed-communities first.");
    }

    // ── Create 50 students ─────────────────────────────────────────────────
    const usedUsernames = new Set<string>();
    const usedUsns = new Set<string>();
    const studentIds: number[] = [];

    const passwordHash = await bcrypt.hash("Student@123", 10);

    for (let i = 0; i < 50; i++) {
      const firstName = rand(FIRST_NAMES);
      const lastName = rand(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;
      const branch = rand(BRANCHES);
      const semester = rand(SEMESTERS);
      const year = ["21", "22", "23", "24"][randInt(0, 3)];
      const rollNum = String(randInt(1, 120)).padStart(3, "0");

      // Generate unique username
      let base = `${firstName.toLowerCase()}${lastName.toLowerCase().slice(0, 4)}`;
      let username = base;
      let attempt = 1;
      while (usedUsernames.has(username)) {
        username = `${base}${attempt++}`;
      }
      usedUsernames.add(username);

      // Generate unique USN
      const branchCode = branch === "CSE" ? "CS" : branch === "ISE" ? "IS" : branch === "ECE" ? "EC" : branch === "EEE" ? "EE" : branch === "MECH" ? "ME" : branch === "CIVIL" ? "CV" : branch === "AIML" ? "AD" : "DS";
      let usn = `1RV${year}${branchCode}${rollNum}`;
      let usnAttempt = 0;
      while (usedUsns.has(usn)) {
        usn = `1RV${year}${branchCode}${String(randInt(1, 999)).padStart(3, "0")}`;
        if (usnAttempt++ > 20) break;
      }
      usedUsns.add(usn);

      const email = `${username}@college.edu`;
      const mobileNumber = `9${randInt(100000000, 999999999)}`;
      const avatarColor = rand(AVATAR_COLORS);
      const dob = `${randInt(2000, 2005)}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`;

      // 45 approved, 5 pending (simulates waiting for review)
      const accountStatus = i < 45 ? "approved" : "pending";

      const { rows } = await client.query(
        `INSERT INTO users (username, name, email, mobile_number, usn, branch, semester, dob, password_hash, role, avatar_color, account_status, onboarding_complete, coins)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'user', $10, $11, true, $12)
         RETURNING id`,
        [username, fullName, email, mobileNumber, usn, branch, semester, dob, passwordHash, avatarColor, accountStatus, randInt(50, 300)],
      );
      studentIds.push(rows[0].id);
    }

    console.log(`✅ Created ${studentIds.length} students (45 approved, 5 pending)`);

    // ── Join communities ────────────────────────────────────────────────────
    const approvedIds = studentIds.slice(0, 45);
    if (communities.length > 0) {
      for (const userId of approvedIds) {
        const numCommunities = randInt(1, 4);
        const shuffled = [...communities].sort(() => Math.random() - 0.5).slice(0, numCommunities);
        for (const c of shuffled) {
          await client.query(
            `INSERT INTO community_members (user_id, community_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [userId, c.id],
          );
        }
      }
      console.log("✅ Joined approved students to communities");
    }

    // ── 5 posts per section ─────────────────────────────────────────────────
    // Community posts
    for (let i = 0; i < 5; i++) {
      const authorId = rand(approvedIds);
      const community = communities.length > 0 ? rand(communities) : null;
      await client.query(
        `INSERT INTO posts (author_id, body, kind, community_id, images)
         VALUES ($1, $2, 'post', $3, '{}')`,
        [authorId, rand(COMMUNITY_POSTS), community?.id ?? null],
      );
    }

    // Hackathon posts
    for (let i = 0; i < 5; i++) {
      const authorId = rand(approvedIds);
      await client.query(
        `INSERT INTO posts (author_id, body, kind, images, hackathon_date, hackathon_location, hackathon_team_size, hackathon_skills)
         VALUES ($1, $2, 'hackathon', '{}', $3, $4, $5, $6)`,
        [
          authorId,
          rand(HACKATHON_POSTS),
          `2025-${String(randInt(6, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
          rand(["Online", "Bangalore", "Chennai", "Mumbai", "Hyderabad", "Delhi"]),
          randInt(2, 5),
          [rand(["React", "Node.js", "Python", "ML", "Flutter", "IoT", "Blockchain", "AWS"])],
        ],
      );
    }

    // Marketplace posts (activity feed only — actual listings created below)
    for (let i = 0; i < 5; i++) {
      const authorId = rand(approvedIds);
      await client.query(
        `INSERT INTO activity (actor_id, kind, message, target_name)
         VALUES ($1, 'marketplace_listed', $2, 'marketplace')`,
        [authorId, rand(MARKETPLACE_POST_CONTENT)],
      );
    }

    // Freelance posts (activity feed only — actual services created below)
    for (let i = 0; i < 5; i++) {
      const authorId = rand(approvedIds);
      await client.query(
        `INSERT INTO activity (actor_id, kind, message, target_name)
         VALUES ($1, 'freelance_listed', $2, 'freelance')`,
        [authorId, rand(FREELANCE_POST_CONTENT)],
      );
    }

    console.log("✅ Created 5 posts in each section (community, hackathon, marketplace, freelance)");

    // ── Marketplace products (5) ─────────────────────────────────────────────
    const products = [
      { title: "HP 15s Laptop i5 11th Gen 16GB", description: "Used 1 year, excellent condition, no scratches. Original charger included.", price: "28000.00", category: "electronics", contact_info: "DM on Unify" },
      { title: "Engineering Maths Textbooks M1+M2", description: "B.S. Grewal 44th edition + H.K. Dass. Minimal highlighting.", price: "350.00", category: "books", contact_info: "Hostel Block C, Room 214" },
      { title: "Keychron K2 Mechanical Keyboard", description: "Red switches, wireless+wired. Barely used. No scratches.", price: "4200.00", category: "electronics", contact_info: "Cash or UPI, DM here" },
      { title: "Bicycle — Firefox Rapide 21-speed", description: "New tyres, serviced 3 months ago. Ideal for campus commute.", price: "5500.00", category: "other", contact_info: "Near main gate on weekends" },
      { title: "Scientific Calculator Casio FX-991EX", description: "Barely used, works perfectly. Selling since I'm graduating.", price: "700.00", category: "electronics", contact_info: "Library entrance, any weekday" },
    ];

    for (const p of products) {
      const sellerId = rand(approvedIds);
      await client.query(
        `INSERT INTO marketplace_products (seller_id, title, description, price, category, contact_info, images)
         VALUES ($1, $2, $3, $4, $5, $6, '{}')`,
        [sellerId, p.title, p.description, p.price, p.category, p.contact_info],
      );
    }
    console.log(`✅ Created ${products.length} marketplace listings`);

    // ── Freelance services (5) ─────────────────────────────────────────────
    const services = [
      { title: "Full-Stack Web App Development", description: "React + Node.js + PostgreSQL. REST API, auth, deployment. Custom quote available.", price: "3500.00", category: "development", delivery_days: 10, contact_info: "Message for consultation" },
      { title: "UI/UX Design — Figma Mockups", description: "Clean, modern mockups and prototypes for apps and websites. Design systems included.", price: "1500.00", category: "design", delivery_days: 6, contact_info: "DM with project brief" },
      { title: "ML Model Training & Integration", description: "scikit-learn, TensorFlow, PyTorch. Good for capstone projects.", price: "2500.00", category: "development", delivery_days: 14, contact_info: "Reach out with dataset details" },
      { title: "Video Editing — Reels & YouTube", description: "Quick turnaround, transitions, captions, color grading. Starts at ₹500/video.", price: "500.00", category: "design", delivery_days: 2, contact_info: "Send footage via Drive link" },
      { title: "Android App Development (Java/Kotlin)", description: "Firebase, REST APIs, notifications. Full source code + APK. 1 app on Play Store.", price: "4000.00", category: "development", delivery_days: 12, contact_info: "DM for requirements" },
    ];

    for (const s of services) {
      const providerId = rand(approvedIds);
      await client.query(
        `INSERT INTO freelance_services (provider_id, title, description, price, category, delivery_days, contact_info, images)
         VALUES ($1, $2, $3, $4, $5, $6, $7, '{}')`,
        [providerId, s.title, s.description, s.price, s.category, s.delivery_days, s.contact_info],
      );
    }
    console.log(`✅ Created ${services.length} freelance services`);

    await client.query("COMMIT");
    console.log("\n🎉 Seed complete!");
    console.log("   50 students (45 approved, 5 pending)");
    console.log("   5 activity entries per section");
    console.log("   5 marketplace listings");
    console.log("   5 freelance services");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
