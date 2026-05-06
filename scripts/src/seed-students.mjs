/**
 * Seed script: 100 students with full profile data
 * Run: node scripts/src/seed-students.mjs
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const bcrypt = require(path.resolve(__dirname, "../../node_modules/.pnpm/bcrypt@6.0.0/node_modules/bcrypt/bcrypt.js"));
const { Pool } = require(path.resolve(__dirname, "../../node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js"));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PASSWORD_HASH = await bcrypt.hash("Student@123", 10);

const BRANCHES = ["CS","IS","EC","EE","ME","CE","AI","AD","CI","AM"];
const SEMESTERS = ["3","4","5","6","7","8"];
const AVATAR_COLORS = ["#7c5cff","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f97316","#06b6d4"];

const FIRST_NAMES = [
  "Arjun","Priya","Rahul","Sneha","Vikram","Anjali","Kiran","Deepa","Suresh","Meera",
  "Rohan","Nisha","Aakash","Pooja","Siddharth","Kavya","Amit","Divya","Varun","Swati",
  "Nikhil","Riya","Harish","Lakshmi","Manoj","Soumya","Pavan","Shalini","Ravi","Shreya",
  "Aditya","Bhavana","Gopal","Ishaan","Jyoti","Kartik","Lavanya","Mohan","Naveen","Pallavi",
  "Ramesh","Sarika","Tarun","Uma","Vignesh","Wasim","Xena","Yashas","Zara","Akhil",
  "Bharat","Charan","Disha","Esha","Farhan","Girish","Hema","Imran","Jasmine","Keerthi",
  "Lokesh","Madhuri","Nandini","Omkar","Pavithra","Raj","Sandhya","Tanmay","Usha","Vijay",
  "Abhishek","Brinda","Chirag","Divyesh","Eshwar","Faisal","Gayatri","Harsh","Indira","Jayesh",
  "Kritika","Lekha","Manish","Neha","Omkar","Prajwal","Rachna","Shubham","Tanya","Uday",
  "Vinay","Ashwini","Balaji","Chaitra","Devika","Firoz","Geeta","Hemant","Isha","Jayant"
];

const BIOS = [
  "Passionate about coding and open-source projects.",
  "Final year student exploring machine learning.",
  "Love building mobile apps and gaming in free time.",
  "Cybersecurity enthusiast and CTF player.",
  "Frontend developer who loves clean UI.",
  "Backend wizard obsessed with system design.",
  "Data nerd who speaks SQL in sleep.",
  "Robotics club member building autonomous bots.",
  "Aspiring entrepreneur with a side hustle.",
  "Photography + code = my life.",
  "Competitive programmer, solved 300+ problems.",
  "Cloud-native developer on AWS/GCP.",
  "UI/UX designer who codes designs into life.",
  "Blockchain developer exploring Web3.",
  "DevOps practitioner automating everything.",
  "Research intern at a local AI lab.",
  "Startup founder building EdTech tools.",
  "Open source contributor to multiple projects.",
  "Mentor helping juniors crack placements.",
  "IoT enthusiast building smart home devices.",
];

const SKILLS_POOL = [
  ["React","Node.js","TypeScript","PostgreSQL"],
  ["Python","Machine Learning","TensorFlow","Pandas"],
  ["Flutter","Dart","Firebase","REST APIs"],
  ["C++","DSA","Competitive Programming","Git"],
  ["UI/UX","Figma","Adobe XD","CSS"],
  ["AWS","Docker","Kubernetes","Terraform"],
  ["Cybersecurity","Kali Linux","CTF","Networking"],
  ["Blockchain","Solidity","Web3.js","Ethereum"],
  ["Java","Spring Boot","Microservices","MySQL"],
  ["Unity","C#","Game Development","3D Modeling"],
  ["Next.js","Tailwind CSS","GraphQL","Prisma"],
  ["Data Science","Scikit-learn","Matplotlib","Jupyter"],
  ["Angular","RxJS","NgRx","TypeScript"],
  ["Rust","WebAssembly","Systems Programming"],
  ["Robotics","Arduino","ROS","Python"],
  ["Android","Kotlin","Jetpack Compose","Room DB"],
  ["Vue.js","Nuxt.js","Vuex","JavaScript"],
  ["Django","FastAPI","SQLAlchemy","Redis"],
  ["Go","gRPC","Protobuf","Microservices"],
  ["Swift","iOS","SwiftUI","Core Data"],
];

const HACKATHON_POSTS = [
  { body: "Looking for teammates for HackMIT 2025! We'll build an AI-powered study assistant. Need: 1 ML engineer + 1 backend dev.", location: "Online", teamSize: 3, skills: ["Python","TensorFlow","FastAPI"] },
  { body: "Joining Smart India Hackathon this year. Our theme: sustainable agriculture using IoT sensors. Need a hardware enthusiast!", location: "Bengaluru", teamSize: 4, skills: ["IoT","Arduino","Python","React"] },
  { body: "Building a mental health app for the college hackathon next month. Looking for a UI/UX designer and frontend developer.", location: "Online", teamSize: 3, skills: ["React","Figma","Firebase"] },
  { body: "Hackathon @ IIT Bombay in 3 weeks — EdTech problem statement. I'll handle backend, need frontend + ML teammate.", location: "Mumbai", teamSize: 3, skills: ["Machine Learning","Next.js","Node.js"] },
  { body: "Team for HackCBS 7.0 — fintech track. Have a solid idea around UPI fraud detection using ML.", location: "Delhi", teamSize: 4, skills: ["Python","Data Science","React","Security"] },
  { body: "Looking for a blockchain developer for an NFT-based certificate verification hackathon project. Remote-friendly team.", location: "Online", teamSize: 3, skills: ["Solidity","Web3.js","React"] },
  { body: "Hackathon team open for 2 spots. Building a real-time traffic management system using computer vision.", location: "Hyderabad", teamSize: 4, skills: ["OpenCV","Python","React","AWS"] },
  { body: "Joining Flipkart Grid 6.0. Need a teammate with strong DSA + backend skills. I'll handle the ML pipeline.", location: "Online", teamSize: 2, skills: ["Machine Learning","Java","Spring Boot"] },
  { body: "DevHacks 2025 registration open. Building an AR campus navigation app. Need Unity developer + backend dev.", location: "Online", teamSize: 3, skills: ["Unity","AR","Node.js","MongoDB"] },
  { body: "NASA Space Apps challenge — team forming! Astronomy + coding enthusiasts welcome. Any skill level.", location: "Online", teamSize: 5, skills: ["Python","React","Data Visualization"] },
  { body: "Looking for 3 teammates for CodeStorm hackathon. Domain: healthcare, idea involves patient triage AI.", location: "Pune", teamSize: 4, skills: ["Python","Flutter","Firebase"] },
  { body: "Startup hackathon at Bangalore this weekend. 48 hours, cash prizes. Building a peer-to-peer lending platform.", location: "Bengaluru", teamSize: 3, skills: ["React","Node.js","Stripe API"] },
  { body: "Open source hackathon for college students — building tools for accessibility. Need frontend + accessibility expertise.", location: "Online", teamSize: 3, skills: ["React","ARIA","CSS","Testing"] },
  { body: "Hardware hackathon next month, building a low-cost ECG monitor using Arduino. Need circuit + firmware person.", location: "Chennai", teamSize: 3, skills: ["Arduino","C++","Embedded Systems"] },
  { body: "Game jam this weekend — 72 hours to build a game from scratch. Looking for an artist + sound designer.", location: "Online", teamSize: 3, skills: ["Unity","C#","Pixel Art","Blender"] },
];

const FREELANCE_SERVICES = [
  { title: "React Frontend Development", description: "I'll build responsive React applications with modern UI/UX. Experienced with Tailwind CSS, Redux, and REST API integration.", price: 2500, category: "Web Development", deliveryDays: 5 },
  { title: "Machine Learning Model Training", description: "Custom ML models for classification, regression, or recommendation. I'll clean data, train, evaluate, and deliver with documentation.", price: 3500, category: "Data Science & AI", deliveryDays: 7 },
  { title: "Logo & Brand Identity Design", description: "Professional logo design in Figma/Illustrator. Includes 3 concepts, unlimited revisions until you're happy.", price: 800, category: "Graphic Design", deliveryDays: 3 },
  { title: "Python Automation Scripts", description: "Automate repetitive tasks using Python. Web scraping, file processing, email automation — anything you need.", price: 1200, category: "Programming", deliveryDays: 2 },
  { title: "Full Stack Web App", description: "Complete web application with React frontend + Node.js backend + PostgreSQL database. Deployed on cloud.", price: 8000, category: "Web Development", deliveryDays: 14 },
  { title: "Android App Development", description: "Native Android app in Kotlin with Material Design. Includes 2 major screens + API integration.", price: 5000, category: "Mobile Development", deliveryDays: 10 },
  { title: "Data Analysis Report", description: "In-depth data analysis using Python (Pandas, Matplotlib, Seaborn). Includes visualizations and insights report.", price: 1500, category: "Data Science & AI", deliveryDays: 3 },
  { title: "WordPress Website Setup", description: "Set up a professional WordPress site with theme customization, plugins, and basic SEO optimization.", price: 2000, category: "Web Development", deliveryDays: 4 },
  { title: "UI/UX Design Mockups", description: "High-fidelity Figma designs for your app or website. Mobile + desktop versions with design system.", price: 3000, category: "UI/UX Design", deliveryDays: 5 },
  { title: "Competitive Programming Coaching", description: "1-on-1 sessions to improve your DSA and CP skills. Covers arrays, graphs, DP, and segment trees.", price: 500, category: "Tutoring", deliveryDays: 1 },
  { title: "Flutter Cross-Platform App", description: "Cross-platform mobile app in Flutter for Android & iOS. Firebase backend included.", price: 6000, category: "Mobile Development", deliveryDays: 12 },
  { title: "Video Editing & Motion Graphics", description: "Professional video editing with transitions, color grading, and motion graphics. For YouTube, Reels, or presentations.", price: 1800, category: "Video & Animation", deliveryDays: 3 },
  { title: "Bug Fixing & Code Review", description: "Find and fix bugs in your existing codebase. Thorough code review with improvement suggestions.", price: 600, category: "Programming", deliveryDays: 1 },
  { title: "Cybersecurity Audit", description: "Basic security audit of your web app — XSS, SQL injection, broken auth checks, and vulnerability report.", price: 2200, category: "Cybersecurity", deliveryDays: 4 },
  { title: "Technical Content Writing", description: "Well-researched technical blog posts, documentation, or README files. SEO-optimized and developer-friendly.", price: 400, category: "Writing", deliveryDays: 2 },
  { title: "Database Design & Optimization", description: "Design efficient PostgreSQL/MySQL schemas. Query optimization, indexing strategy, and ER diagrams.", price: 1800, category: "Programming", deliveryDays: 3 },
  { title: "REST API Development", description: "Robust REST API using Node.js/Express or FastAPI. Includes authentication, rate limiting, and documentation.", price: 3500, category: "Web Development", deliveryDays: 6 },
  { title: "Photography Editing", description: "Professional photo editing with color correction, retouching, and filters. Up to 50 photos per order.", price: 700, category: "Photography", deliveryDays: 2 },
  { title: "Maths & Physics Tutoring", description: "Clear explanations for engineering maths and physics. Online sessions via Google Meet. All topics covered.", price: 300, category: "Tutoring", deliveryDays: 1 },
  { title: "3D Modeling in Blender", description: "3D models for games, product visualization, or animation. Low-poly to realistic quality.", price: 2500, category: "3D Design", deliveryDays: 6 },
];

const MARKETPLACE_PRODUCTS = [
  { title: "MTech Data Structures Notes", description: "Handwritten notes for DS — arrays, trees, graphs, DP. Very clean and easy to understand. Perfect for exams.", price: 150, category: "Books & Notes" },
  { title: "HP 15 Laptop (2021)", description: "Used HP 15 laptop, i5 11th gen, 8GB RAM, 512GB SSD. Works perfectly. Selling because upgrading.", price: 28000, category: "Electronics" },
  { title: "Engineering Drawing Kit", description: "Complete drafter set — compass, scales, protractor, set squares. Never used, mint condition.", price: 300, category: "Stationery" },
  { title: "Algorithms by CLRS (3rd Ed)", description: "Introduction to Algorithms by Cormen. Some pencil marks inside but all pages intact.", price: 800, category: "Books & Notes" },
  { title: "Noise Cancelling Earphones", description: "Sony WH-1000XM4 barely used. Fantastic sound quality. Selling because got gifted another pair.", price: 15000, category: "Electronics" },
  { title: "Mechanical Keyboard", description: "Keychron K6 with Brown switches. 6 months old, excellent condition. Comes with USB-C cable.", price: 5500, category: "Electronics" },
  { title: "Lab Coat (Medium)", description: "Chemistry lab coat, white, medium size. Used for 1 semester. Very clean, washed twice.", price: 200, category: "Clothing" },
  { title: "Calculus by Thomas Finney", description: "10th edition, some highlights. Good condition. Selling after completing the course.", price: 350, category: "Books & Notes" },
  { title: "College Hoodie (L)", description: "Official college hoodie in large. Worn twice. Maroon colour. No defects.", price: 500, category: "Clothing" },
  { title: "Raspberry Pi 4 (4GB)", description: "Raspberry Pi 4 Model B 4GB. Complete kit with power supply, HDMI adapter, and 32GB SD card.", price: 4500, category: "Electronics" },
  { title: "Python Programming Notes", description: "Typed notes for Python basics to advanced — OOP, file I/O, web scraping. A4 printed booklet.", price: 100, category: "Books & Notes" },
  { title: "Graphics Tablet - Wacom One", description: "Wacom One drawing tablet. Perfect for digital art and signing docs. Used 3 months.", price: 3000, category: "Electronics" },
  { title: "Organic Chemistry (JD Lee)", description: "JD Lee Inorganic Chemistry, concise edition. Light annotations. Useful for chemistry electives.", price: 450, category: "Books & Notes" },
  { title: "Student Tiffin Box Set", description: "Stainless steel 3-tier tiffin box set. Perfect for hostel. Used 2 months, very clean.", price: 280, category: "Other" },
  { title: "Badminton Racket Pair", description: "Yonex racket pair with shuttle cocks and bag. Great for evening sports. Lightly used.", price: 1200, category: "Sports" },
  { title: "Arduino Starter Kit", description: "Arduino Uno R3 starter kit with breadboard, jumpers, LEDs, sensors. Everything in box.", price: 900, category: "Electronics" },
  { title: "Sketchbook + Pastels", description: "A3 spiral sketchbook + oil pastels + charcoal set. Ideal for fine arts. Barely used.", price: 350, category: "Art & Crafts" },
  { title: "Organic Makhana Snack", description: "200g pack of roasted makhana. Healthy and tasty. Homemade by my mom! Order fresh every week.", price: 120, category: "Food & Snacks" },
  { title: "DBMS and OS Notes (Printed)", description: "Comprehensive printed notes for DBMS + OS. Based on VTU syllabus. Neatly organized.", price: 180, category: "Books & Notes" },
  { title: "Wireless Mouse - Logitech M235", description: "Logitech M235 wireless mouse. 1 year old, works perfectly. Selling because upgrading.", price: 600, category: "Electronics" },
];

// Get existing community and interest IDs
const { rows: communityRows } = await pool.query("SELECT id FROM communities ORDER BY id");
const communityIds = communityRows.map(r => r.id);
const { rows: interestRows } = await pool.query("SELECT id FROM interests ORDER BY id");
const interestIds = interestRows.map(r => r.id);

function pick(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

console.log("Creating 100 student accounts...");

const createdUserIds = [];

for (let i = 0; i < 100; i++) {
  const branch = BRANCHES[i % BRANCHES.length];
  const num = String(i + 1).padStart(3, "0");
  const usn = `1XX21${branch}${num}`;
  const firstName = FIRST_NAMES[i];
  const username = `${firstName.toLowerCase()}${i + 1}`;
  const semester = rand(SEMESTERS);
  const bio = BIOS[i % BIOS.length];
  const skills = SKILLS_POOL[i % SKILLS_POOL.length];
  const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
  const email = `${username}@unify.edu`;

  const { rows: [user] } = await pool.query(
    `INSERT INTO users (username, name, bio, email, usn, semester, branch, password_hash, avatar_color, skills, onboarding_complete, coins, weekly_points, is_private)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,50,0,false)
     ON CONFLICT DO NOTHING RETURNING id`,
    [username, firstName, bio, email, usn, semester, branch, PASSWORD_HASH, avatarColor, skills]
  );

  if (!user) { console.log(`Skip ${usn} (conflict)`); continue; }

  createdUserIds.push(user.id);

  // Add 3-5 interests
  const userInterests = pick(interestIds, 3 + (i % 3));
  for (const interestId of userInterests) {
    await pool.query(
      "INSERT INTO user_interests (user_id, interest_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [user.id, interestId]
    );
  }

  // Join 3-6 communities
  const userCommunities = pick(communityIds, 3 + (i % 4));
  for (const communityId of userCommunities) {
    await pool.query(
      "INSERT INTO community_members (user_id, community_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [user.id, communityId]
    );
  }

  if (i % 10 === 0) process.stdout.write(`  ${i + 1}/100 users created\n`);
}

console.log(`\nCreated ${createdUserIds.length} users. Adding activity data...`);

// Post hackathon invites (first 40 users get one each from the pool)
const hackUsers = pick(createdUserIds, Math.min(40, createdUserIds.length));
for (let i = 0; i < hackUsers.length; i++) {
  const h = HACKATHON_POSTS[i % HACKATHON_POSTS.length];
  await pool.query(
    `INSERT INTO posts (author_id, body, kind, hackathon_location, hackathon_team_size, hackathon_skills)
     VALUES ($1,$2,'hackathon',$3,$4,$5)`,
    [hackUsers[i], h.body, h.location, h.teamSize, h.skills]
  );
}
console.log(`  ${hackUsers.length} hackathon posts created`);

// Freelance services (first 50 users)
const freelanceUsers = pick(createdUserIds, Math.min(50, createdUserIds.length));
for (let i = 0; i < freelanceUsers.length; i++) {
  const s = FREELANCE_SERVICES[i % FREELANCE_SERVICES.length];
  await pool.query(
    `INSERT INTO freelance_services (provider_id, title, description, price, category, delivery_days)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [freelanceUsers[i], s.title, s.description, s.price, s.category, s.deliveryDays]
  );
}
console.log(`  ${freelanceUsers.length} freelance services created`);

// Marketplace products (60 users)
const productUsers = pick(createdUserIds, Math.min(60, createdUserIds.length));
for (let i = 0; i < productUsers.length; i++) {
  const p = MARKETPLACE_PRODUCTS[i % MARKETPLACE_PRODUCTS.length];
  await pool.query(
    `INSERT INTO marketplace_products (seller_id, title, description, price, category)
     VALUES ($1,$2,$3,$4,$5)`,
    [productUsers[i], p.title, p.description, p.price, p.category]
  );
}
console.log(`  ${productUsers.length} marketplace products listed`);

await pool.end();
console.log("\nDone! 100 students seeded successfully.");
console.log("All students can log in with their USN and password: Student@123");
