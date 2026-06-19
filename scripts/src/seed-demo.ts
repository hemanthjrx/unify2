import pg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const AVATAR_COLORS = ["#7c5cff","#e85d75","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#f97316","#06b6d4","#84cc16","#ef4444"];
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }
function randInt(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }

async function run() {
  const client = await pool.connect();
  try {
    // ───── CLEAR EXISTING DATA ─────
    await client.query(`
      TRUNCATE warning_strikes, reports, service_reviews, product_reviews,
        notifications, messages, post_likes, post_comments, posts,
        freelance_services, marketplace_products, community_messages,
        community_members, communities, follows, user_interests, interests,
        categories, activity
      RESTART IDENTITY CASCADE
    `);
    // Keep admin/moderator users but clear others
    await client.query(`DELETE FROM users WHERE username NOT IN ('ADMIN','MODERATOR')`);

    // ───── INTERESTS ─────
    const interestData = [
      { name:"Coding", category:"Tech", emoji:"💻" },
      { name:"Hackathons", category:"Tech", emoji:"🏆" },
      { name:"IoT", category:"Tech", emoji:"🔌" },
      { name:"Machine Learning", category:"Tech", emoji:"🤖" },
      { name:"Web Development", category:"Tech", emoji:"🌐" },
      { name:"App Development", category:"Tech", emoji:"📱" },
      { name:"Cloud Computing", category:"Tech", emoji:"☁️" },
      { name:"Cybersecurity", category:"Tech", emoji:"🔐" },
      { name:"Data Science", category:"Tech", emoji:"📊" },
      { name:"Robotics", category:"Tech", emoji:"🦾" },
      { name:"Design", category:"Creative", emoji:"🎨" },
      { name:"Photography", category:"Creative", emoji:"📷" },
      { name:"Video Editing", category:"Creative", emoji:"🎬" },
      { name:"Music", category:"Creative", emoji:"🎵" },
      { name:"Entrepreneurship", category:"Business", emoji:"🚀" },
      { name:"Finance", category:"Business", emoji:"💰" },
      { name:"Basketball", category:"Sports", emoji:"🏀" },
      { name:"Cricket", category:"Sports", emoji:"🏏" },
      { name:"Badminton", category:"Sports", emoji:"🏸" },
      { name:"Chess", category:"Academic", emoji:"♟️" },
      { name:"Reading", category:"Academic", emoji:"📚" },
      { name:"Public Speaking", category:"Academic", emoji:"🎤" },
      { name:"Open Source", category:"Tech", emoji:"🐙" },
      { name:"3D Printing", category:"Tech", emoji:"🖨️" },
      { name:"Gaming", category:"Creative", emoji:"🎮" },
      { name:"Anime", category:"Creative", emoji:"⛩️" },
    ];
    const interestRows: Record<string,number> = {};
    for (const i of interestData) {
      const r = await client.query(
        `INSERT INTO interests(name,category,emoji) VALUES($1,$2,$3) ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
        [i.name, i.category, i.emoji]
      );
      interestRows[i.name] = r.rows[0].id;
    }

    // ───── CATEGORIES ─────
    const cats = [
      { type:"marketplace", name:"Electronics" },
      { type:"marketplace", name:"Books & Notes" },
      { type:"marketplace", name:"Stationery" },
      { type:"marketplace", name:"Clothing" },
      { type:"marketplace", name:"Gadgets" },
      { type:"marketplace", name:"Lab Equipment" },
      { type:"marketplace", name:"Sports" },
      { type:"marketplace", name:"Food" },
      { type:"freelance", name:"Graphic Design" },
      { type:"freelance", name:"Web Development" },
      { type:"freelance", name:"Video Editing" },
      { type:"freelance", name:"Academic Help" },
      { type:"freelance", name:"Content Writing" },
      { type:"freelance", name:"UI/UX Design" },
      { type:"freelance", name:"Photography" },
      { type:"freelance", name:"Resume & Career" },
      { type:"freelance", name:"AI & Automation" },
    ];
    for (const c of cats) {
      await client.query(`INSERT INTO categories(type,name) VALUES($1,$2)`, [c.type, c.name]);
    }

    // ───── USERS ─────
    const hash = async (pw: string) => bcrypt.hash(pw, 10);

    const primaryStudents = [
      { name:"Abhishek", usn:"1EW25IC001", username:"1EW25IC001", password:"abhishek123", bio:"IoT enthusiast and hackathon participant. Love building smart home devices.", skills:["Arduino","Python","C++","IoT"], coins:320, interests:["IoT","Coding","Hackathons"] },
      { name:"Abu Talha", usn:"1EW25IC002", username:"1EW25IC002", password:"abu123", bio:"Full-stack developer passionate about web tech. MERN stack lover.", skills:["React","Node.js","MongoDB","Express"], coins:280, interests:["Web Development","Coding","Open Source"] },
      { name:"Chandan S", usn:"1EW25IC008", username:"1EW25IC008", password:"chandan123", bio:"Graphic designer and creative thinker. Making the campus more colorful.", skills:["Figma","Canva","Photoshop","Illustrator"], coins:415, interests:["Design","Photography","Video Editing"] },
      { name:"Gagan R", usn:"1EW25IC011", username:"1EW25IC011", password:"gagan123", bio:"ML researcher and data nerd. Turning data into insights everyday.", skills:["Python","TensorFlow","Pandas","SQL"], coins:360, interests:["Machine Learning","Data Science","Coding"] },
      { name:"Hemanth Raj", usn:"1EW25IC020", username:"1EW25IC020", password:"hemanth123", bio:"App developer and entrepreneur. Currently building a startup for campus food delivery.", skills:["Flutter","Firebase","Dart","React Native"], coins:500, interests:["App Development","Entrepreneurship","Hackathons"] },
    ];

    const additionalStudents = [
      { name:"Priya Nair", usn:"1EW25IC003", username:"1EW25IC003", password:"priya123", bio:"Cloud enthusiast and AWS practitioner.", skills:["AWS","Docker","Kubernetes","Terraform"], coins:220, interests:["Cloud Computing","Coding","Open Source"] },
      { name:"Arjun Sharma", usn:"1EW25IC004", username:"1EW25IC004", password:"arjun123", bio:"Cybersecurity researcher. Ethical hacker in training.", skills:["Kali Linux","Wireshark","Python","Networking"], coins:310, interests:["Cybersecurity","Coding","Open Source"] },
      { name:"Sneha Reddy", usn:"1EW25IC005", username:"1EW25IC005", password:"sneha123", bio:"Data scientist who loves turning messy data into beautiful stories.", skills:["Python","R","Tableau","SQL"], coins:275, interests:["Data Science","Machine Learning","Chess"] },
      { name:"Kiran Kumar", usn:"1EW25IC006", username:"1EW25IC006", password:"kiran123", bio:"Robotics hobbyist building a self-balancing bot.", skills:["Arduino","ROS","C++","SolidWorks"], coins:195, interests:["Robotics","IoT","3D Printing"] },
      { name:"Divya Menon", usn:"1EW25IC007", username:"1EW25IC007", password:"divya123", bio:"UI/UX designer creating user-friendly interfaces.", skills:["Figma","Adobe XD","Sketch","CSS"], coins:330, interests:["Design","App Development","Photography"] },
      { name:"Rahul Verma", usn:"1EW25IC009", username:"1EW25IC009", password:"rahul123", bio:"Open source contributor and backend dev.", skills:["Java","Spring Boot","PostgreSQL","Redis"], coins:145, interests:["Coding","Open Source","Reading"] },
      { name:"Kavya Iyer", usn:"1EW25IC010", username:"1EW25IC010", password:"kavya123", bio:"Creative writer and content creator.", skills:["Copywriting","SEO","WordPress","Canva"], coins:260, interests:["Reading","Public Speaking","Entrepreneurship"] },
      { name:"Darshan K", usn:"1EW25IC012", username:"1EW25IC012", password:"darshan123", bio:"Gaming enthusiast and Unity developer.", skills:["Unity","C#","Blender","Game Design"], coins:180, interests:["Gaming","3D Printing","Coding"] },
      { name:"Ananya Pillai", usn:"1EW25IC013", username:"1EW25IC013", password:"ananya123", bio:"Finance and fintech explorer. Building budgeting apps.", skills:["Excel","Python","Tableau","Finance"], coins:290, interests:["Finance","Entrepreneurship","Data Science"] },
      { name:"Vikram Rao", usn:"1EW25IC014", username:"1EW25IC014", password:"vikram123", bio:"Cricket fanatic and weekend coder.", skills:["JavaScript","React","CSS","Git"], coins:155, interests:["Cricket","Coding","Music"] },
      { name:"Nisha Singh", usn:"1EW25IC015", username:"1EW25IC015", password:"nisha123", bio:"Photographer capturing campus life everyday.", skills:["Lightroom","Photoshop","Photography","Reels"], coins:340, interests:["Photography","Video Editing","Music"] },
      { name:"Aditya Joshi", usn:"1EW25IC016", username:"1EW25IC016", password:"aditya123", bio:"Passionate about AR/VR tech and immersive experiences.", skills:["Unity","AR Foundation","C#","3D Modeling"], coins:225, interests:["Gaming","3D Printing","App Development"] },
      { name:"Meera Nambiar", usn:"1EW25IC017", username:"1EW25IC017", password:"meera123", bio:"Public speaker and debate team captain.", skills:["Communication","Leadership","Research","Writing"], coins:380, interests:["Public Speaking","Reading","Chess"] },
      { name:"Rohan Gupta", usn:"1EW25IC018", username:"1EW25IC018", password:"rohan123", bio:"Blockchain developer exploring DeFi.", skills:["Solidity","Web3.js","React","Ethereum"], coins:270, interests:["Coding","Finance","Open Source"] },
      { name:"Sanjana Desai", usn:"1EW25IC019", username:"1EW25IC019", password:"sanjana123", bio:"Anime lover and manga artist.", skills:["Illustration","Procreate","Digital Art","Manga"], coins:310, interests:["Anime","Design","Music"] },
    ];

    const moderators = [
      { name:"Dr. Ravi Kumar", username:"moderator01", password:"mod@123" },
      { name:"Prof. Anjali Sharma", username:"moderator02", password:"mod@123" },
      { name:"Dr. Shashank Rao", username:"moderator03", password:"mod@123" },
      { name:"Prof. Deepa N", username:"moderator04", password:"mod@123" },
    ];

    // Insert moderators
    const modIds: number[] = [];
    for (const m of moderators) {
      const ph = await hash(m.password);
      const r = await client.query(
        `INSERT INTO users(username,name,role,password_hash,coins,account_status,onboarding_complete,is_private,avatar_color,banner_color)
         VALUES($1,$2,'moderator',$3,999,'approved',true,false,$4,'#1a1040') RETURNING id`,
        [m.username, m.name, ph, pick(AVATAR_COLORS)]
      );
      modIds.push(r.rows[0].id);
    }

    // Insert all students
    const allStudentDefs = [...primaryStudents, ...additionalStudents];
    const studentIds: number[] = [];
    const studentUsernames: string[] = [];
    for (let i = 0; i < allStudentDefs.length; i++) {
      const s = allStudentDefs[i];
      const ph = await hash(s.password);
      const sem = "2";
      const branch = "CI"; // CSE IoT
      const r = await client.query(
        `INSERT INTO users(username,name,usn,role,password_hash,coins,account_status,onboarding_complete,is_private,avatar_color,banner_color,bio,skills,semester,branch,year_enrolled)
         VALUES($1,$2,$3,'user',$4,$5,'approved',true,false,$6,'#0f172a',$7,$8,$9,$10,'2025') RETURNING id`,
        [s.username, s.name, s.usn, ph, s.coins, pick(AVATAR_COLORS), s.bio, s.skills, sem, branch]
      );
      studentIds.push(r.rows[0].id);
      studentUsernames.push(s.username);
    }

    // Assign interests
    for (let i = 0; i < allStudentDefs.length; i++) {
      const s = allStudentDefs[i];
      for (const iname of s.interests) {
        const iid = interestRows[iname];
        if (iid) {
          await client.query(
            `INSERT INTO user_interests(user_id,interest_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
            [studentIds[i], iid]
          ).catch(() => {});
        }
      }
    }

    // ───── COMMUNITIES ─────
    const commDefs = [
      { slug:"iot-makers", name:"IoT Makers", desc:"Build, hack, and tinker with IoT devices. From Arduino to Raspberry Pi!", icon:"🔌", color:"#10b981", tags:["IoT","Hardware","Arduino"] },
      { slug:"web-dev-hub", name:"Web Dev Hub", desc:"Frontend, backend, full-stack — all things web development.", icon:"🌐", color:"#3b82f6", tags:["Web","React","Node.js"] },
      { slug:"design-studio", name:"Design Studio", desc:"Creative minds crafting beautiful UI, graphics, and brand identities.", icon:"🎨", color:"#ec4899", tags:["Design","UI/UX","Figma"] },
      { slug:"ml-research", name:"ML Research", desc:"Exploring machine learning, deep learning, and AI frontiers.", icon:"🤖", color:"#8b5cf6", tags:["ML","AI","Python"] },
      { slug:"startup-lab", name:"Startup Lab", desc:"Entrepreneurs, innovators, and future founders building the next big thing.", icon:"🚀", color:"#f59e0b", tags:["Startup","Business","Innovation"] },
      { slug:"cyber-squad", name:"Cyber Squad", desc:"Ethical hacking, CTFs, and cybersecurity challenges.", icon:"🔐", color:"#ef4444", tags:["Security","Hacking","CTF"] },
      { slug:"photo-club", name:"Photo Club", desc:"Capture the world through your lens. Weekly shoots, edits, and showcases.", icon:"📷", color:"#06b6d4", tags:["Photography","Art","Creative"] },
      { slug:"open-source-devs", name:"Open Source Devs", desc:"Contributing to open source projects and building developer portfolios.", icon:"🐙", color:"#84cc16", tags:["Open Source","Git","Code"] },
      { slug:"hackathon-squad", name:"Hackathon Squad", desc:"Team up, build fast, win hackathons across India!", icon:"🏆", color:"#f97316", tags:["Hackathon","Competition","Team"] },
      { slug:"data-nerds", name:"Data Nerds", desc:"SQL, Pandas, Tableau — we love data in all its forms.", icon:"📊", color:"#14b8a6", tags:["Data","Analytics","SQL"] },
    ];

    const commIds: number[] = [];
    for (const c of commDefs) {
      const r = await client.query(
        `INSERT INTO communities(slug,name,description,icon,accent_color,tags,leader_id,image_url,banner_image_url,profile_image_url)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [c.slug, c.name, c.desc, c.icon, c.color, c.tags, studentIds[randInt(0,4)],
         `https://picsum.photos/seed/${c.slug}1/800/400`,
         `https://picsum.photos/seed/${c.slug}2/1200/400`,
         `https://picsum.photos/seed/${c.slug}3/400/400`]
      );
      commIds.push(r.rows[0].id);
    }

    // Join communities
    const allUserIds = [...studentIds, ...modIds];
    for (const uid of allUserIds) {
      const toJoin = pickN(commIds, randInt(2, 6));
      for (const cid of toJoin) {
        await client.query(
          `INSERT INTO community_members(user_id,community_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
          [uid, cid]
        ).catch(() => {});
      }
    }

    // ───── FOLLOWS (100+) ─────
    // Primary students follow everyone
    const primaryIds = studentIds.slice(0, 5);
    const otherIds = studentIds.slice(5);

    // Mutual follows among primary students
    for (let i = 0; i < primaryIds.length; i++) {
      for (let j = 0; j < primaryIds.length; j++) {
        if (i !== j) {
          await client.query(
            `INSERT INTO follows(follower_id,followee_id,status) VALUES($1,$2,'accepted') ON CONFLICT DO NOTHING`,
            [primaryIds[i], primaryIds[j]]
          ).catch(() => {});
        }
      }
    }

    // Primary students follow additional students
    for (const pid of primaryIds) {
      const toFollow = pickN(otherIds, randInt(8, 14));
      for (const fid of toFollow) {
        await client.query(
          `INSERT INTO follows(follower_id,followee_id,status) VALUES($1,$2,'accepted') ON CONFLICT DO NOTHING`,
          [pid, fid]
        ).catch(() => {});
      }
    }

    // Additional students follow primary and each other
    for (const uid of otherIds) {
      // Follow all primary
      for (const pid of primaryIds) {
        await client.query(
          `INSERT INTO follows(follower_id,followee_id,status) VALUES($1,$2,'accepted') ON CONFLICT DO NOTHING`,
          [uid, pid]
        ).catch(() => {});
      }
      // Follow some others
      const toFollow = pickN(otherIds.filter(id => id !== uid), randInt(3, 7));
      for (const fid of toFollow) {
        await client.query(
          `INSERT INTO follows(follower_id,followee_id,status) VALUES($1,$2,'accepted') ON CONFLICT DO NOTHING`,
          [uid, fid]
        ).catch(() => {});
      }
    }

    // Pending follow requests
    const pendingSenders = pickN(otherIds, 5);
    const pendingReceivers = pickN(primaryIds, 5);
    for (let i = 0; i < 5; i++) {
      await client.query(
        `INSERT INTO follows(follower_id,followee_id,status) VALUES($1,$2,'pending') ON CONFLICT DO NOTHING`,
        [pendingSenders[i], pendingReceivers[i]]
      ).catch(() => {});
    }

    // ───── MARKETPLACE PRODUCTS ─────
    const products = [
      { title:"Arduino Uno R3", desc:"Original Arduino Uno R3 with USB cable. Used for 2 projects. Works perfectly.", price:"450", cat:"Electronics", seller:0 },
      { title:"ESP32 Development Board", desc:"ESP32 with WiFi & Bluetooth. Perfect for IoT projects. 2 units available.", price:"380", cat:"Electronics", seller:1 },
      { title:"Raspberry Pi 4 (4GB)", desc:"Raspberry Pi 4B with 4GB RAM. Includes case and cooling fan.", price:"3500", cat:"Electronics", seller:4 },
      { title:"VTU Engineering Notes (Sem 2)", desc:"Complete handwritten notes for all Sem 2 subjects. Neatly organized.", price:"200", cat:"Books & Notes", seller:2 },
      { title:"Scientific Calculator FX-991EX", desc:"Casio FX-991EX scientific calculator, barely used.", price:"650", cat:"Stationery", seller:3 },
      { title:"Mechanical Keyboard (TKL)", desc:"Redragon K552 TKL mechanical keyboard. Red switches. Excellent condition.", price:"1800", cat:"Gadgets", seller:5 },
      { title:"Logitech M235 Mouse", desc:"Wireless mouse, great battery life. Bought 3 months ago.", price:"400", cat:"Gadgets", seller:6 },
      { title:"Laptop Stand (Adjustable)", desc:"Aluminum alloy adjustable laptop stand. Compatible with all laptops.", price:"750", cat:"Gadgets", seller:7 },
      { title:"Sony WH-1000XM3 Headphones", desc:"Noise-cancelling headphones. Minor scratches but works flawlessly.", price:"8500", cat:"Gadgets", seller:8 },
      { title:"Engineering Drawing Kit", desc:"Staedtler drawing kit with all instruments. New condition.", price:"350", cat:"Stationery", seller:9 },
      { title:"Breadboard + Jumper Kit", desc:"830-point breadboard with 120 jumper wires. Essential for electronics lab.", price:"180", cat:"Lab Equipment", seller:10 },
      { title:"DS3231 RTC Module (x3)", desc:"3x RTC modules for Arduino/Pi projects. Tested and working.", price:"120", cat:"Lab Equipment", seller:11 },
      { title:"VTU Lab Manual (CSE Sem 2)", desc:"Filled lab manual with all programs. Useful for reference.", price:"150", cat:"Books & Notes", seller:12 },
      { title:"32GB USB Pendrive", desc:"SanDisk Ultra 32GB USB 3.0 pendrive. 2 years old but works fine.", price:"250", cat:"Gadgets", seller:13 },
      { title:"Formal Shirt (M size)", desc:"Allen Solly formal shirt. Worn twice. Great for interviews.", price:"600", cat:"Clothing", seller:14 },
      { title:"Badminton Racket Set", desc:"Yonex combo set with 2 rackets + 6 shuttlecocks + bag.", price:"1200", cat:"Sports", seller:0 },
      { title:"Python Programming Book", desc:"Automate the Boring Stuff with Python by Al Sweigart. Paperback.", price:"300", cat:"Books & Notes", seller:1 },
      { title:"OLED Display Module (0.96\")", desc:"I2C OLED display for Arduino projects. Pack of 2.", price:"160", cat:"Lab Equipment", seller:2 },
      { title:"Noise Buds Smart (TWS)", desc:"boAt Airdopes 141, Bluetooth 5.0. Good battery life.", price:"900", cat:"Gadgets", seller:3 },
      { title:"Poster Colors Set", desc:"Camel poster color set, 12 shades. Opened but barely used.", price:"180", cat:"Stationery", seller:4 },
    ];

    const productIds: number[] = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const sid = studentIds[p.seller % studentIds.length];
      const r = await client.query(
        `INSERT INTO marketplace_products(seller_id,title,description,price,category,images,contact_info)
         VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [sid, p.title, p.desc, p.price, p.cat,
         [`https://picsum.photos/seed/prod${i+1}/400/400`,`https://picsum.photos/seed/prod${i+1}b/400/400`],
         `DM for details`]
      );
      productIds.push(r.rows[0].id);
    }

    // Product reviews
    const reviewComments = [
      "Great product! Exactly as described.", "Fast delivery and good quality.",
      "Works perfectly. Highly recommend!", "Good value for money.",
      "Seller was very responsive and helpful.", "Product is as described. Satisfied!",
      "Excellent condition. Will buy again.", "Very happy with this purchase!",
    ];
    for (const pid of productIds) {
      const reviewers = pickN(studentIds, randInt(2, 5));
      for (const rid of reviewers) {
        await client.query(
          `INSERT INTO product_reviews(product_id,reviewer_id,rating,comment) VALUES($1,$2,$3,$4)`,
          [pid, rid, randInt(3, 5), pick(reviewComments)]
        ).catch(() => {});
      }
    }

    // ───── FREELANCE SERVICES ─────
    const services = [
      { title:"Wedding Invitation Design", desc:"Stunning digital wedding invitations with custom typography and illustrations. 3 revision rounds included.", price:"999", cat:"Graphic Design", delivery:3, seller:2 },
      { title:"Logo Design & Branding", desc:"Professional logo design with brand kit. PNG, SVG, PDF formats. Unlimited revisions.", price:"1499", cat:"Graphic Design", delivery:5, seller:2 },
      { title:"Poster & Flyer Design", desc:"Eye-catching event posters and promotional flyers. Quick 24hr delivery available.", price:"299", cat:"Graphic Design", delivery:1, seller:7 },
      { title:"React Website Development", desc:"Responsive React websites with modern UI. Includes deployment on Vercel/Netlify.", price:"3999", cat:"Web Development", delivery:10, seller:1 },
      { title:"Python Assignment Help", desc:"Debug, explain, and solve Python assignments. DSA, OOP, file handling covered.", price:"199", cat:"Academic Help", delivery:1, seller:3 },
      { title:"AI-Powered PPT Creation", desc:"Professional presentations using AI tools. Up to 20 slides with animations.", price:"499", cat:"AI & Automation", delivery:2, seller:4 },
      { title:"Resume & LinkedIn Design", desc:"ATS-friendly resume design with LinkedIn profile optimization. 2 revisions.", price:"399", cat:"Resume & Career", delivery:2, seller:9 },
      { title:"UI/UX App Design (Figma)", desc:"Complete mobile app UI/UX in Figma. Wireframes → High fidelity → Prototype.", price:"2499", cat:"UI/UX Design", delivery:7, seller:6 },
      { title:"Portfolio Website", desc:"Personal portfolio website with React + animations. Hosted and deployed.", price:"2999", cat:"Web Development", delivery:7, seller:1 },
      { title:"Video Editing (Reels/Shorts)", desc:"Trending reels editing with effects, transitions, and captions. Up to 90 seconds.", price:"349", cat:"Video Editing", delivery:1, seller:14 },
    ];

    const serviceIds: number[] = [];
    for (let i = 0; i < services.length; i++) {
      const s = services[i];
      const sid = studentIds[s.seller % studentIds.length];
      const r = await client.query(
        `INSERT INTO freelance_services(provider_id,title,description,price,category,delivery_days,images,contact_info)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [sid, s.title, s.desc, s.price, s.cat, s.delivery,
         [`https://picsum.photos/seed/svc${i+1}/400/400`,`https://picsum.photos/seed/svc${i+1}b/400/400`],
         `Contact via DM`]
      );
      serviceIds.push(r.rows[0].id);
    }

    // Service reviews
    const serviceComments = [
      "Amazing work! Delivered ahead of schedule.", "Very professional and creative.",
      "Exactly what I needed. 5 stars!", "Great communication and quality work.",
      "Will definitely hire again!", "Exceeded my expectations.",
      "Clean and modern design. Loved it!", "Quick delivery and very responsive.",
    ];
    for (const sid of serviceIds) {
      const reviewers = pickN(studentIds, randInt(3, 6));
      for (const rid of reviewers) {
        await client.query(
          `INSERT INTO service_reviews(service_id,reviewer_id,rating,comment) VALUES($1,$2,$3,$4)`,
          [sid, rid, randInt(3, 5), pick(serviceComments)]
        ).catch(() => {});
      }
    }

    // ───── POSTS ─────
    const postBodies = [
      "Just finished building a smart irrigation system using ESP32 and soil moisture sensors! The crops thank me 🌱",
      "Looking for teammates for Smart Campus Hackathon 2026! Need a backend dev and a designer. DM me!",
      "Deployed my first React app on Vercel today! It feels great to see your work live on the internet 🌐",
      "If you're struggling with DSA, start with arrays and strings first. Build intuition before jumping to trees!",
      "Our UI/UX team just completed the campus event app design. Here are some screens — feedback welcome! 🎨",
      "Pro tip: Use Raspberry Pi + Camera Module for a home security system. Cost under ₹3000!",
      "Just cracked my first CTF challenge! Cybersecurity is fascinating but brutal. Who else is into it?",
      "Our college should have a maker space with 3D printers and soldering stations. Who agrees? 🙋",
      "Data Science internship experience: The first week is just cleaning data. No glamour, just grind!",
      "Finished reading Atomic Habits. Genuinely life-changing. Highly recommend to every student!",
      "Posted my first open source contribution! It's a small bugfix but I'm proud 🐙",
      "Who wants to do a mini hackathon this weekend? Let's build something in 24 hours!",
      "Figma tip: Use auto-layout for everything. Your future self will thank you when clients ask for changes.",
      "Python one-liner of the day: sorted(dict.items(), key=lambda x: x[1]) — sort dict by value!",
      "Campus photography walk tomorrow at 6pm. Bring your cameras! Registrations open in the group.",
      "Enrolled in AWS Cloud Practitioner course. Goal: get certified by next semester!",
      "The best project ideas come from your own problems. Build solutions for yourself first.",
      "Just completed my first freelancing gig on the platform! Got paid ₹999 for a logo design. Feels amazing!",
      "Arduino + OLED display project: built a mini weather station that fetches live data via WiFi ☁️",
      "Anyone has experience with Docker containers? Need help setting up for my final year project.",
      "Badminton practice session at 4pm. Court 2. Come join — all skill levels welcome 🏸",
      "Manga recommendation: Chainsaw Man. If you haven't read it yet, you're missing out on art.",
      "Looking for a study partner for DBMS and OS. Library, 5th floor, 3pm. Ping me!",
      "Blockchain isn't just crypto. Supply chain, healthcare, voting — the applications are endless!",
      "Published a blog on Medium about my GSoC application journey. Link in bio 📝",
    ];

    const postIds: number[] = [];
    for (let i = 0; i < postBodies.length; i++) {
      const authorId = pick(studentIds);
      const commId = Math.random() > 0.4 ? pick(commIds) : null;
      const r = await client.query(
        `INSERT INTO posts(author_id,community_id,body,kind,created_at)
         VALUES($1,$2,$3,'post',NOW() - INTERVAL '${randInt(1,90)} days') RETURNING id`,
        [authorId, commId, postBodies[i]]
      );
      postIds.push(r.rows[0].id);
    }

    // Hackathon posts
    const hackathons = [
      { name:"AI Innovation Challenge 2026", loc:"BMS College, Bangalore", date:"2026-03-15", skills:["ML","Python","TensorFlow"], fee:"Free", problem:"Build AI solutions for real-world campus problems", link:"https://aiinnovation2026.devfolio.co" },
      { name:"Smart Campus Hackathon", loc:"EWIT, Bangalore", date:"2026-02-20", skills:["IoT","Arduino","Cloud"], fee:"₹200/team", problem:"Automate campus operations using IoT and cloud tech", link:"https://smartcampus.devfolio.co" },
      { name:"Cyber Security Sprint", loc:"RV College, Bangalore", date:"2026-04-10", skills:["Cybersecurity","Python","Networking"], fee:"Free", problem:"Find and fix vulnerabilities in simulated enterprise networks", link:"https://cybersprint.devfolio.co" },
      { name:"IoT Buildathon", loc:"Online (Hybrid)", date:"2026-03-28", skills:["IoT","ESP32","MQTT"], fee:"Free", problem:"Build a smart device that improves daily student life", link:"https://iotbuildathon.devfolio.co" },
      { name:"CodeFest 2026", loc:"PES University, Bangalore", date:"2026-05-05", skills:["Coding","Algorithms","DSA"], fee:"₹100/person", problem:"Competitive programming + product building challenge", link:"https://codefest2026.devfolio.co" },
    ];

    const hackPostIds: number[] = [];
    for (let i = 0; i < hackathons.length; i++) {
      const h = hackathons[i];
      const authorId = primaryIds[i % 5];
      const r = await client.query(
        `INSERT INTO posts(author_id,body,kind,hackathon_date,hackathon_location,hackathon_team_size,hackathon_skills,hackathon_college_name,hackathon_registration_fee,hackathon_problem_statement,hackathon_registration_link,created_at)
         VALUES($1,$2,'hackathon',$3,$4,4,$5,$6,$7,$8,$9,NOW() - INTERVAL '${randInt(5,30)} days') RETURNING id`,
        [authorId, `🚀 Hackathon Alert: ${h.name}\n\nLooking for teammates! ${h.problem}`, h.date, h.loc, h.skills, h.loc.split(",")[0], h.fee, h.problem, h.link]
      );
      hackPostIds.push(r.rows[0].id);
    }

    // Post likes
    const allPostIds = [...postIds, ...hackPostIds];
    for (const pid of allPostIds) {
      const likers = pickN(studentIds, randInt(2, 12));
      for (const lid of likers) {
        await client.query(
          `INSERT INTO post_likes(post_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
          [pid, lid]
        ).catch(() => {});
      }
    }

    // Post comments
    const commentBodies = [
      "This is amazing! Count me in!", "Great work, keep it up!",
      "I'm interested! Will DM you.", "This is exactly what I was looking for.",
      "Nice project! What's the next step?", "Can I join your team?",
      "Very helpful, thanks for sharing!", "Love this idea! Let's collaborate.",
      "Solid work! How long did this take?", "This deserves way more attention!",
    ];
    for (const pid of allPostIds) {
      const numComments = randInt(1, 4);
      for (let c = 0; c < numComments; c++) {
        const authorId = pick(studentIds);
        await client.query(
          `INSERT INTO post_comments(post_id,author_id,body,created_at)
           VALUES($1,$2,$3,NOW() - INTERVAL '${randInt(0,30)} days')`,
          [pid, authorId, pick(commentBodies)]
        ).catch(() => {});
      }
    }

    // ───── MESSAGES ─────
    const messageTemplates = [
      ["Hey! Saw your post about the hackathon. I'm interested in joining!", "Great! What tech stack are you comfortable with?", "I know React and Node.js. Also some Python for backend.", "Perfect! We need a frontend person. Are you free this weekend to discuss?", "Yes, Saturday works. I'll DM you on Discord too."],
      ["Hi! Is the Arduino kit still available?", "Yes it is! Come check it out in person if you want.", "Sure! Are you in campus tomorrow?", "I'll be there after 3pm. Lab 204.", "Perfect, see you then! 🙌"],
      ["Hey Chandan, loved your design work! Can you help me with a logo?", "Of course! What's the project about?", "It's a student startup for campus food delivery.", "Nice! Send me some reference images and brand colors.", "Will send by tonight. What's your price for this?", "For fellow students, ₹499. Includes 3 revisions.", "Perfect! Let's do it."],
      ["Can I get your Python notes? Missed last week's lab.", "Sure! I'll share on WhatsApp. What's your number?", "Shared! Let me know if any doubts.", "Thanks so much! You're a lifesaver 🙏"],
      ["Hey! Are you participating in CodeFest 2026?", "Yes! Looking for one more teammate. You in?", "Definitely! I'm good at DP and graph algorithms.", "Great, let's connect on Devfolio and register together."],
      ["Your photography work is stunning! Do you take campus portraits?", "Thanks! Yes I do. ₹199 per session, 10 edited photos.", "That's great value! Can we book for next Friday?", "Friday works. Let's meet near the main gate at 5pm.", "Perfect! Looking forward to it 📷"],
      ["Read your blog about GSoC. Very inspiring!", "Thanks! It took 3 months of prep. Worth it though!", "Any tips for first-time applicants?", "Start with small contributions. Get familiar with the codebase first.", "Thanks, I'll start this weekend!"],
    ];

    // Create DM conversations
    for (let i = 0; i < studentIds.length && i < messageTemplates.length; i++) {
      const sender = studentIds[i];
      const receiver = studentIds[(i + 1) % studentIds.length];
      const msgs = messageTemplates[i];
      for (let j = 0; j < msgs.length; j++) {
        const isEven = j % 2 === 0;
        await client.query(
          `INSERT INTO messages(sender_id,recipient_id,body,kind,read,created_at)
           VALUES($1,$2,$3,'text',true,NOW() - INTERVAL '${randInt(1,30)} days - ${j*10} minutes')`,
          [isEven ? sender : receiver, isEven ? receiver : sender, msgs[j]]
        );
      }
    }

    // Extra conversations between primary students
    for (let i = 0; i < primaryIds.length; i++) {
      for (let j = i+1; j < primaryIds.length; j++) {
        const msgs2 = ["Hey! How's the project going?", "Going well! Just integrated the sensor module.", "Nice! Can we sync up tomorrow?", "Sure, after classes at 4pm?", "Works for me!"];
        for (let k = 0; k < msgs2.length; k++) {
          const isEven = k % 2 === 0;
          await client.query(
            `INSERT INTO messages(sender_id,recipient_id,body,kind,read,created_at)
             VALUES($1,$2,$3,'text',true,NOW() - INTERVAL '${randInt(1,10)} days - ${k*5} minutes')`,
            [isEven ? primaryIds[i] : primaryIds[j], isEven ? primaryIds[j] : primaryIds[i], msgs2[k]]
          );
        }
      }
    }

    // Marketplace inquiry messages
    const mktMsgs = [
      ["Hi! Is the Raspberry Pi still available?", "Yes! Come see it in campus.", "Great, I'll come tomorrow at 3pm.", "See you then!"],
      ["The ESP32 board — does it come with pins soldered?", "Yes, both SMD and through-hole pins included.", "Perfect! Can you reduce to ₹350?", "₹360 is my best. Deal?", "Deal! I'll come Saturday."],
      ["Is the calculator FX-991EX original?", "100% original with box and warranty card.", "What's the usage like?", "Used for one semester only. All functions work perfectly.", "Okay I'll take it!"],
    ];
    for (let m = 0; m < mktMsgs.length; m++) {
      const buyer = studentIds[(m + 5) % studentIds.length];
      const seller = studentIds[products[m].seller % studentIds.length];
      const msgs3 = mktMsgs[m];
      for (let j = 0; j < msgs3.length; j++) {
        const isEven = j % 2 === 0;
        await client.query(
          `INSERT INTO messages(sender_id,recipient_id,body,kind,read,created_at)
           VALUES($1,$2,$3,'text',true,NOW() - INTERVAL '${randInt(1,15)} days - ${j*5} minutes')`,
          [isEven ? buyer : seller, isEven ? seller : buyer, msgs3[j]]
        );
      }
    }

    // Pending chat requests (3 messages, not accepted follow)
    const pendingChats = [
      ["Hey! I saw your hackathon post.", "Are you still looking for teammates?", "I have experience in ML and Python."],
      ["Hi! I loved your design portfolio.", "Can you help me with a logo design?", "Budget is around ₹500."],
      ["Hey! Interested in buying your Raspberry Pi.", "Is ₹3200 okay?", "Can we meet on campus?"],
      ["Hello! Your Python notes look great.", "Can you share them?", "I'll return the favor with my ML notes."],
      ["Hi! Saw your badminton post.", "Want to play this evening?", "I'm free from 5pm."],
    ];
    for (let pc = 0; pc < pendingChats.length; pc++) {
      const sender = otherIds[pc];
      const receiver = primaryIds[pc];
      for (const msg of pendingChats[pc]) {
        await client.query(
          `INSERT INTO messages(sender_id,recipient_id,body,kind,read,created_at)
           VALUES($1,$2,$3,'text',false,NOW() - INTERVAL '${randInt(1,5)} days')`,
          [sender, receiver, msg]
        );
      }
    }

    // ───── WARNINGS ─────
    const warningData = [
      { user:9, reason:"Spam posting in community chat. Posted the same promotional message 15+ times.", mod:0 },
      { user:12, reason:"Used abusive language in comment section targeting another student.", mod:1 },
      { user:11, reason:"Posted a fake marketplace listing with misleading product images.", mod:2 },
      { user:13, reason:"Repeatedly posting off-topic content in the IoT Makers community.", mod:3 },
      { user:14, reason:"Harassment via direct messages. Reported by 3 different users.", mod:0 },
      { user:8, reason:"Sharing pirated software links in Web Dev Hub community.", mod:1 },
      { user:10, reason:"Impersonating a faculty member in messages.", mod:2 },
      { user:15, reason:"Posting inappropriate meme content in public feed.", mod:3 },
      { user:16, reason:"Creating multiple fake accounts to boost own product ratings.", mod:0 },
      { user:17, reason:"Misrepresentation in freelance service listing. Did not deliver as promised.", mod:1 },
    ];
    for (const w of warningData) {
      const uid = studentIds[w.user % studentIds.length];
      const mid = modIds[w.mod % modIds.length];
      await client.query(
        `INSERT INTO warning_strikes(user_id,issued_by_id,description,created_at)
         VALUES($1,$2,$3,NOW() - INTERVAL '${randInt(5,60)} days')`,
        [uid, mid, w.reason]
      );
    }

    // ───── BANNED USERS ─────
    const bannedDefs = [
      { name:"Fake Seller01", username:"fakeacct001", reason:"Fraud — collected payment without delivering products. 5 complaints filed." },
      { name:"Harass User02", username:"harasacct002", reason:"Severe harassment. Sent threatening messages to multiple female students." },
      { name:"Spam Bot03", username:"spambot003", reason:"Automated spam account posting malicious links in communities." },
      { name:"Imposter04", username:"imposter004", reason:"Impersonating a faculty member and collecting sensitive information." },
      { name:"Scammer05", username:"scammer005", reason:"Multiple fake freelancing listings. Took advance payment and disappeared." },
    ];
    for (const b of bannedDefs) {
      const ph = await hash("banned@123");
      await client.query(
        `INSERT INTO users(username,name,role,password_hash,coins,account_status,onboarding_complete,is_private,is_banned,avatar_color,banner_color,bio)
         VALUES($1,$2,'user',$3,0,'approved',true,false,true,$4,'#1a1040',$5)`,
        [b.username, b.name, ph, pick(AVATAR_COLORS), b.reason]
      );
    }

    // ───── REPORTS ─────
    const reportStatuses = ["pending","resolved","resolved","pending","resolved","pending","resolved","pending","resolved","pending"];
    const reportDescs = [
      "This user is spamming the same promotional content across multiple communities.",
      "Received threatening messages from this user. Screenshots attached.",
      "The product listing is clearly fake. Images are stolen from Amazon.",
      "This freelancer took my advance payment and is now unresponsive.",
      "User is impersonating a college faculty member.",
      "Inappropriate content being shared in the Design Studio community.",
      "This account is posting links to phishing websites.",
      "User shared my personal information without consent.",
      "Duplicate account created to bypass ban.",
      "False product review submitted to sabotage competitor.",
    ];
    for (let i = 0; i < 10; i++) {
      const reporter = pick(studentIds);
      const targetUser = pick(studentIds.filter(id => id !== reporter));
      await client.query(
        `INSERT INTO reports(reporter_id,target_type,target_id,description,status,reviewed_by,reviewed_at,review_note,created_at)
         VALUES($1,'user',$2,$3,$4,$5,$6,$7,NOW() - INTERVAL '${randInt(5,45)} days')`,
        [reporter, targetUser, reportDescs[i], reportStatuses[i],
         reportStatuses[i] === "resolved" ? pick(modIds) : null,
         reportStatuses[i] === "resolved" ? new Date() : null,
         reportStatuses[i] === "resolved" ? "Reviewed and action taken." : null]
      );
    }

    // ───── NOTIFICATIONS ─────
    const notifTypes: string[] = ["follow","like","follow_request","follow_accepted"];
    for (let i = 0; i < 100; i++) {
      const recipient = pick(allUserIds.filter(id => studentIds.includes(id)));
      const actor = pick(studentIds.filter(id => id !== recipient));
      const type = pick(notifTypes);
      const postId = (type === "like") ? pick(allPostIds) : null;
      await client.query(
        `INSERT INTO notifications(recipient_id,actor_id,type,post_id,read,created_at)
         VALUES($1,$2,$3,$4,$5,NOW() - INTERVAL '${randInt(0,30)} days')`,
        [recipient, actor, type, postId, Math.random() > 0.4]
      ).catch(() => {});
    }

    // ───── ACTIVITY FEED ─────
    const activityDefs = [
      { kind:"join_community", msg:"joined the IoT Makers community" },
      { kind:"post_created", msg:"shared a new post in Web Dev Hub" },
      { kind:"marketplace_listed", msg:"listed a new product in Marketplace" },
      { kind:"freelance_listed", msg:"posted a new freelancing service" },
      { kind:"hackathon_posted", msg:"posted a hackathon invitation" },
      { kind:"follow", msg:"started following a new student" },
      { kind:"review_received", msg:"received a 5-star review on a service" },
      { kind:"coins_earned", msg:"earned coins for community contribution" },
      { kind:"post_liked", msg:"liked a post in the community feed" },
      { kind:"service_ordered", msg:"completed a freelancing order" },
    ];

    const activityMsgs = [
      ["Hemanth Raj", "uploaded a new freelancing service: AI-Powered PPT Creation"],
      ["Chandan S", "listed Raspberry Pi 4 in the marketplace"],
      ["Abu Talha", "joined the Smart Campus Hackathon team"],
      ["Gagan R", "completed a freelancing order for Logo Design"],
      ["Abhishek", "received a 5-star review on Arduino Uno listing"],
      ["Priya Nair", "joined the Cloud Computing community"],
      ["Arjun Sharma", "posted in Cyber Squad: Just solved my first CTF!"],
      ["Sneha Reddy", "earned 50 coins for helping in the ML Research community"],
      ["Kiran Kumar", "listed Engineering Drawing Kit in marketplace"],
      ["Divya Menon", "completed UI/UX design for a campus app"],
      ["Rahul Verma", "made his first open source contribution"],
      ["Kavya Iyer", "published a blog on Medium about campus life"],
      ["Darshan K", "posted a new Unity game demo in Gaming community"],
      ["Ananya Pillai", "joined the Startup Lab community"],
      ["Vikram Rao", "shared cricket team formation post"],
      ["Nisha Singh", "posted campus photography from evening walk"],
      ["Aditya Joshi", "listed AR/VR project on freelance platform"],
      ["Meera Nambiar", "won the campus debate competition"],
      ["Rohan Gupta", "shared a Solidity smart contract tutorial"],
      ["Sanjana Desai", "posted manga-style fan art in Design Studio"],
    ];

    for (let i = 0; i < 100; i++) {
      const actor = pick(studentIds);
      const actDef = pick(activityDefs);
      const custom = activityMsgs[i % activityMsgs.length];
      await client.query(
        `INSERT INTO activity(actor_id,kind,message,target_name,created_at)
         VALUES($1,$2,$3,$4,NOW() - INTERVAL '${randInt(0,60)} days')`,
        [actor, actDef.kind, custom[1], custom[0]]
      );
    }

    // ───── COMMUNITY MESSAGES ─────
    const communityMessageSamples = [
      "Hey everyone! Working on a new IoT project — soil moisture sensor with ESP32. Will share updates!",
      "Anyone interested in forming a study group for this week's lab experiments?",
      "Sharing my project notes here: https://github.com — feel free to fork!",
      "Reminder: Club meeting tomorrow at 5pm in Room 204. Attendance mandatory.",
      "Just found an amazing YouTube channel for learning React. DM me if you want the link!",
      "Our team just won the regional hackathon! 🏆 Can't wait to share the project.",
      "Looking for a Figma collaborator for our startup app design. Ping me!",
      "Weekend photography walk this Sunday. Location: Lalbagh, 7am. Anyone joining?",
      "Quick tip: Use async/await instead of promises for cleaner code. Less callback hell!",
      "Exam season coming up — anyone want to do mock group study sessions?",
    ];
    for (let ci = 0; ci < commIds.length; ci++) {
      const cid = commIds[ci];
      for (let m = 0; m < 10; m++) {
        const authorId = pick(studentIds);
        await client.query(
          `INSERT INTO community_messages(community_id,author_id,content,created_at)
           VALUES($1,$2,$3,NOW() - INTERVAL '${randInt(1,30)} days - ${m*30} minutes')`,
          [cid, authorId, communityMessageSamples[m % communityMessageSamples.length]]
        );
      }
    }

    console.log("✅ Demo seed complete!");
    console.log(`   Users: ${allStudentDefs.length} students + 4 moderators + 5 banned`);
    console.log(`   Communities: ${commIds.length}`);
    console.log(`   Products: ${productIds.length}`);
    console.log(`   Services: ${serviceIds.length}`);
    console.log(`   Posts: ${allPostIds.length} (inc. ${hackPostIds.length} hackathons)`);
    console.log(`   Follows: 100+`);
    console.log(`   Notifications: 100`);
    console.log(`   Activity: 100`);
    console.log(`   Warnings: ${warningData.length}`);
    console.log(`   Reports: 10`);

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
