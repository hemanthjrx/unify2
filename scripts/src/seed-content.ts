import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

// ── Reddit-style username map: usn → handle ──
const USERNAME_MAP: Record<string, string> = {
  "1EW25IC001": "pixel_abhi",
  "1EW25IC002": "webwiz_abu",
  "1EW25IC008": "design_chan",
  "1EW25IC011": "ml_gagan",
  "1EW25IC020": "app_hemu",
  "1EW25IC003": "cloudqueen_p",
  "1EW25IC004": "hackr_arjun",
  "1EW25IC005": "data_sneha",
  "1EW25IC006": "bot_kiran",
  "1EW25IC007": "ux_divya",
  "1EW25IC009": "backend_rahul",
  "1EW25IC010": "writr_kavya",
  "1EW25IC012": "gamedev_darsh",
  "1EW25IC013": "fintech_anu",
  "1EW25IC014": "crickbro_vik",
  "1EW25IC015": "lens_nisha",
  "1EW25IC016": "xr_aditya",
  "1EW25IC017": "speakr_meera",
  "1EW25IC018": "web3_rohan",
  "1EW25IC019": "artsy_sanju",
  // applicants
  "1EW25IC021": "circuit_rohit",
  "1EW25IC022": "teja_builds",
  "1EW25IC023": "mano_stack",
  "1EW25IC024": "pooja_codes",
  "1EW25IC025": "suraj_dev",
  "1EW25IC026": "aksha_x",
  "1EW25IC027": "yash_gx",
  "1EW25IC028": "shru_craft",
  "1EW25IC029": "nikz_sec",
  "1EW25IC030": "bhavy_r",
  "1EW25IC031": "ganesh_mx",
  "1EW25IC032": "ranji_ui",
  "1EW25IC033": "pavan_kx",
  "1EW25IC034": "chaitra_s",
  "1EW25IC035": "harish_dev",
  "1EW25CS001": "keerthi_pro",
  "1EW25CS002": "deepak_nx",
  "1EW25CS003": "varsha_cloud",
  "1EW25CS004": "naveen_boss",
  "1EW23IS010": "preethi_ml",
  "1EW23IS011": "vinay_kz",
  "1EW23IS012": "lalit_n",
  "1EW23EC005": "rishi_v",
  "1EW25IC036": "madhuri_r",
  "1EW25IC037": "santo_vx",
};

async function run() {
  const client = await pool.connect();
  try {

    // ══════════════════════════════════════
    // 1. UPDATE USERNAMES → Reddit handles
    // ══════════════════════════════════════
    let updated = 0;
    for (const [usn, handle] of Object.entries(USERNAME_MAP)) {
      const res = await client.query(
        `UPDATE users SET username = $1 WHERE usn = $2 AND username != $1`,
        [handle, usn]
      );
      if ((res.rowCount ?? 0) > 0) updated++;
    }
    console.log(`✅ Usernames updated: ${updated}`);

    // Fetch current approved students for seeding content
    const usersRes = await client.query(
      `SELECT id, username FROM users WHERE role='user' AND account_status='approved' ORDER BY id`
    );
    const users: { id: number; username: string }[] = usersRes.rows;
    const userIds = users.map(u => u.id);

    // Fetch moderator IDs
    const modRes = await client.query(`SELECT id FROM users WHERE role IN ('moderator','admin') ORDER BY id`);
    const modIds: number[] = modRes.rows.map(r => r.id);

    // ══════════════════════════════════════
    // 2. MENTORSHIP QUESTIONS & REPLIES
    // ══════════════════════════════════════
    await client.query(`TRUNCATE mentorship_questions RESTART IDENTITY CASCADE`);

    const questions = [
      {
        title: "How do I get started with Arduino for complete beginners?",
        body: "I bought an Arduino Uno starter kit but have no idea where to begin. I know basic C syntax. What should be my first 3 projects and what resources do you recommend?",
        tags: ["Arduino","IoT","Beginners","C"],
        solved: true,
        replies: [
          { content: "Start with Blink (LED on/off), then move to reading sensors (DHT11 temp sensor), then control a servo motor. YouTube channel 'Paul McWhorter' is gold for absolute beginners. Don't skip the datasheet once you're comfortable.", helpful: true },
          { content: "Tinkercad is amazing for simulating circuits before buying components. You can test your Arduino code virtually — saves money on burnt components 😅", helpful: false },
          { content: "Join r/arduino on Reddit too. Stack Overflow has solved 90% of my Arduino problems. The community is super helpful.", helpful: false },
        ]
      },
      {
        title: "React vs Vue vs Angular — which should I learn as a 2nd-year student?",
        body: "I know basic HTML/CSS/JS. I want to get a web dev internship this summer. Should I go deep into one framework or learn multiple? Job listings in Bangalore mostly ask for React.",
        tags: ["Web Dev","React","Vue","Angular","Internship"],
        solved: true,
        replies: [
          { content: "React, no contest. 70% of Bangalore startup job listings ask for React. Learn hooks, state management (Zustand or Redux), and React Query. Build 2-3 good projects and you'll be interview-ready in 3 months.", helpful: true },
          { content: "I'd say learn React but understand *why* it works — components, virtual DOM, unidirectional data flow. Frameworks change, fundamentals don't.", helpful: true },
          { content: "Don't forget to learn Git/GitHub properly. I've seen candidates rejected because they couldn't explain what a pull request is.", helpful: false },
          { content: "Checkout 'The Odin Project' curriculum — it's free and takes you from zero to full-stack developer. I got my internship 4 months after following it.", helpful: false },
        ]
      },
      {
        title: "Best way to prepare for campus placement technical rounds?",
        body: "Placement season is in 8 months. I'm weak in DSA — I know basic sorting and searching but struggle with graphs and DP. How do I structure my preparation without burning out?",
        tags: ["Placements","DSA","Interviews","LeetCode"],
        solved: true,
        replies: [
          { content: "8 months is plenty of time. Month 1-2: Arrays, Strings, LinkedLists. Month 3-4: Trees, BST, Graphs (BFS/DFS). Month 5-6: DP (start with 1D, then 2D). Month 7: Practice company-specific questions. Month 8: Mock interviews. 2-3 LeetCode problems daily, quality > quantity.", helpful: true },
          { content: "Striver's SDE Sheet on GitHub is the best structured roadmap. 191 problems organized by topic. Many of our seniors cracked Amazon, Infosys, Wipro using just this sheet.", helpful: true },
          { content: "Don't neglect CS fundamentals — DBMS, OS, CN, and OOPs. Many companies ask these in the first round. I lost an offer because I couldn't explain deadlock properly.", helpful: false },
        ]
      },
      {
        title: "How to build a portfolio that stands out for ML/AI roles?",
        body: "I'm learning ML with Python and have done the Andrew Ng course. But I feel my projects look the same as everyone else's — Titanic, MNIST, etc. How do I build a portfolio that actually impresses?",
        tags: ["Machine Learning","Portfolio","AI","Python"],
        solved: false,
        replies: [
          { content: "Build projects on real, unexplored datasets — Kaggle has thousands. Pick a domain you care about (agriculture, healthcare, sports analytics). A project predicting crop yield from soil data will stand out more than the 1000th MNIST classifier.", helpful: true },
          { content: "Deploy your models! Use Streamlit or Gradio to create a web interface. Put it on Hugging Face Spaces (free hosting). Being able to say 'here's a live demo' is 10x better than showing a Jupyter notebook.", helpful: true },
          { content: "Write a blog about your project on Medium or dev.to. Explain what you tried, what failed, what worked. Recruiters love to see your thinking process, not just the end result.", helpful: false },
        ]
      },
      {
        title: "How to get into open source as a first-year student?",
        body: "Everyone talks about open source contributions but I don't know where to start. I'm scared of making mistakes in someone's real project. Which projects are beginner-friendly?",
        tags: ["Open Source","GitHub","Beginners","GSoC"],
        solved: true,
        replies: [
          { content: "Start with 'good-first-issue' labels on GitHub. Filter by language you know. First Few contributions can be docs fixes, typo corrections, or adding tests — don't stress about complex features. Every maintainer loves someone who fixes documentation.", helpful: true },
          { content: "EddieHub community and First Contributions repo are made specifically for beginners. Your first PR might literally just be adding your name to a list — and that's totally fine.", helpful: false },
          { content: "For GSoC, start by contributing to the org you want to apply to 6 months before. Read their codebase, fix small bugs, ask questions on their mailing list/Discord. Orgs heavily prefer applicants who've already contributed.", helpful: true },
        ]
      },
      {
        title: "Is the college WiFi blocking my API calls? Postman works but browser doesn't.",
        body: "I'm making API calls to OpenAI in a React app. Works perfectly on my mobile data but on campus WiFi the calls hang. Postman works fine on the same WiFi. Browser shows CORS error then times out.",
        tags: ["Networking","CORS","WiFi","Debug"],
        solved: true,
        replies: [
          { content: "Classic CORS issue. The server needs to send the right headers. If it's OpenAI's API directly from frontend — don't do that, your API key is exposed. Use a backend proxy (Express/Flask) to make the OpenAI call server-side, then send result to frontend.", helpful: true },
          { content: "Also, some campus firewalls block certain external IPs or ports. Check if you can ping the server from terminal. Use browser DevTools Network tab to see the exact error — is it CORS header missing or timeout?", helpful: false },
          { content: "If it's your own backend that's missing CORS headers, add the cors npm package in Express: app.use(cors()). If you're on Python Flask, use flask-cors. This is the most common mistake.", helpful: true },
        ]
      },
      {
        title: "How to negotiate a stipend for an internship as a 2nd year student?",
        body: "I got an offer from a startup for a 3-month internship. They're offering ₹5000/month. Is this standard? Can I negotiate? I'm afraid they'll withdraw the offer if I ask for more.",
        tags: ["Internship","Career","Negotiation"],
        solved: false,
        replies: [
          { content: "₹5000 is on the lower end for tech internships in Bangalore. ₹8000-15000 is typical for startups, ₹20000+ for product companies. It's completely okay to negotiate. Say: 'I'm very excited about the role. Given my skills in X and Y, would ₹10,000 be possible?' Worst case they say no.", helpful: true },
          { content: "They almost never withdraw offers for politely negotiating. That would be a red flag about the company culture. If they do, you dodged a bullet.", helpful: true },
          { content: "Also ask about other perks — remote work days, letter of recommendation, LinkedIn endorsements, full-time conversion possibility. Sometimes non-monetary benefits matter more.", helpful: false },
        ]
      },
      {
        title: "Raspberry Pi vs ESP32 — which for smart home IoT project?",
        body: "I want to build a home automation system — control fans, lights, monitor temperature and humidity. Both fit my budget. Which is better and why?",
        tags: ["IoT","Raspberry Pi","ESP32","Smart Home"],
        solved: true,
        replies: [
          { content: "For what you described, ESP32 is the better choice. Reasons: 1) Built-in WiFi+BT, 2) Runs on 3.3V easily from batteries, 3) More GPIO pins, 4) Tons of libraries for sensors, 5) Way cheaper (₹300 vs ₹3500). Use Pi only when you need Linux, camera, or complex computation.", helpful: true },
          { content: "Use MQTT protocol for communication between your sensors and a central hub. Mosquitto broker is free and works great. Pair it with Home Assistant (runs on Pi) for a beautiful dashboard.", helpful: false },
          { content: "I built exactly this! ESP32 + DHT22 + 4-channel relay module. Total cost ₹700. I control it from my phone via MQTT. DM me if you want my code on GitHub.", helpful: true },
        ]
      },
      {
        title: "How to structure a semester project to impress professors and get good grades?",
        body: "We have a project submission next month. Our team of 4 is building a student feedback system. We have the basic app working but it looks plain. What should we add to make it stand out?",
        tags: ["Projects","Academic","Team","Presentation"],
        solved: false,
        replies: [
          { content: "Polish the UI — professors are humans too, good design creates instant impression. Add a dashboard with charts (use Chart.js or Recharts). Even simple analytics make it look professional.", helpful: true },
          { content: "Write a proper README with setup instructions, screenshots, architecture diagram, and team contributions. Professors who are coding-literate appreciate this a lot.", helpful: false },
          { content: "Add a problem statement slide before your demo. Explain: what problem exists, who has it, and how your solution solves it better than current methods. Most student projects fail to contextualize the problem.", helpful: true },
          { content: "Record a 2-minute demo video as backup in case live demo fails. Use OBS or Loom. You'll thank yourself when the college WiFi acts up during presentation 😅", helpful: false },
        ]
      },
      {
        title: "What's the difference between ML, DL, and AI — I keep getting confused.",
        body: "People use these terms interchangeably in articles. Can someone explain with simple examples relevant to projects we do in college?",
        tags: ["AI","Machine Learning","Deep Learning","Basics"],
        solved: true,
        replies: [
          { content: "Think of it as nested circles. AI is the broadest (any machine mimicking human intelligence). ML is a subset (machines learning from data without explicit programming). DL is a subset of ML (using neural networks with many layers). Example: AI = chess engine, ML = spam filter, DL = face recognition or GPT.", helpful: true },
          { content: "Practical distinction: If you're using scikit-learn with tabular data → ML. If you're using TensorFlow/PyTorch with images, text, audio → Deep Learning. Both are AI.", helpful: true },
          { content: "For college projects: Classification problems (spam/not spam, disease/no disease) = Classical ML. Image recognition, NLP, voice assistants = Deep Learning. Know which tools fit which problems.", helpful: false },
        ]
      },
      {
        title: "How do I split work fairly in a 4-person group project?",
        body: "We always end up with 1-2 people doing all the work and the rest barely contributing. How do seniors handle team projects? Is there a system that actually works?",
        tags: ["Team","Project Management","College Life"],
        solved: false,
        replies: [
          { content: "Use a Kanban board (Notion or Trello). Break the project into tasks. Assign owners with deadlines. Make tasks public to the group — social accountability works better than nagging.", helpful: true },
          { content: "Define individual deliverables on Day 1. Frontend: person A. Backend: person B. DB design + docs: person C. Testing + presentation: person D. When there's no overlap in ownership, there's no excuse.", helpful: true },
          { content: "Weekly 15-min standups (even on WhatsApp voice call) help a lot. Just: what did you do, what are you doing next, any blockers? It creates momentum.", helpful: false },
        ]
      },
      {
        title: "Best free resources to learn Figma for a beginner designer?",
        body: "I want to start doing UI/UX freelancing but don't know where to learn Figma properly. Most tutorials I find are either too basic or jump to advanced stuff too fast.",
        tags: ["Figma","UI/UX","Design","Freelance"],
        solved: true,
        replies: [
          { content: "Figma's own YouTube channel is underrated — really well-structured for beginners. After that, try 'DesignCode' on YouTube and the 'UI/UX Design Bootcamp' by Gary Simon on freeCodeCamp. Build 3 real app designs, put them on Behance, and start pitching.", helpful: true },
          { content: "Join Figma Community — there are thousands of free UI kits and component libraries you can remix and learn from. Seeing how pros structure their files teaches you more than any tutorial.", helpful: false },
          { content: "Practice by redesigning existing bad UIs. Pick a government website or outdated app and redesign it in Figma. This builds both skill and portfolio simultaneously.", helpful: true },
        ]
      },
    ];

    const questionIds: number[] = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const authorId = userIds[i % userIds.length];
      const r = await client.query(
        `INSERT INTO mentorship_questions(author_id,title,body,tags,is_solved,created_at)
         VALUES($1,$2,$3,$4,$5,NOW() - INTERVAL '${randInt(2,60)} days') RETURNING id`,
        [authorId, q.title, q.body, q.tags, q.solved]
      );
      const qid = r.rows[0].id;
      questionIds.push(qid);

      // Insert replies
      for (let ri = 0; ri < q.replies.length; ri++) {
        const rep = q.replies[ri];
        const repAuthor = userIds[(i + ri + 3) % userIds.length];
        await client.query(
          `INSERT INTO mentorship_replies(question_id,author_id,content,is_helpful,created_at)
           VALUES($1,$2,$3,$4,NOW() - INTERVAL '${randInt(1,30)} days')`,
          [qid, repAuthor, rep.content, rep.helpful]
        );
      }
    }
    console.log(`✅ Mentorship: ${questionIds.length} questions seeded`);

    // ══════════════════════════════════════
    // 3. ANNOUNCEMENTS
    // ══════════════════════════════════════
    await client.query(`TRUNCATE announcements RESTART IDENTITY CASCADE`);

    const adminId = modIds[0] ?? userIds[0];

    const announcements = [
      {
        title: "🎉 Welcome to Unify — Campus Connect Platform!",
        body: `Hey everyone! We're thrilled to officially launch **Unify** — your campus's all-in-one student networking platform!\n\n**What you can do on Unify:**\n- 🤝 Connect with students who share your interests\n- 🏘️ Join interest-based communities\n- 🛒 Buy & sell items in the Marketplace\n- 💼 Offer or hire freelance skills\n- 🏆 Find hackathon teammates\n- 💬 Chat, mentor, and collaborate\n\nComplete your profile, pick your interests, and start exploring. Earn coins by being active!\n\n**Questions?** Drop them in the comments or DM a moderator. Let's build something great together 🚀`,
        days: 3,
      },
      {
        title: "📋 Community Guidelines & Code of Conduct",
        body: `To keep Unify a safe and productive space, please follow these guidelines:\n\n**✅ Do:**\n- Be respectful and constructive in all interactions\n- Use Marketplace honestly — list real items with accurate descriptions\n- Credit others' work when sharing\n- Report suspicious activity using the Report button\n\n**❌ Don't:**\n- Post spam, offensive content, or fake listings\n- Share personal information of others without consent\n- Harass or bully other students\n- Create fake accounts or manipulate ratings\n\n**Violations** result in warnings, temporary bans, or permanent removal depending on severity.\n\nLet's keep this space awesome for everyone 🙌`,
        days: 3,
      },
      {
        title: "🏆 Smart Campus Hackathon 2026 — Registrations Open!",
        body: `The **Smart Campus Hackathon 2026** is officially open for registrations!\n\n**📅 Date:** February 20, 2026\n**📍 Venue:** EWIT Main Auditorium\n**👥 Team Size:** 2-4 members\n**💰 Prize Pool:** ₹50,000+\n\n**Problem Statements:**\n1. Automate campus attendance using IoT + face recognition\n2. Build a smart canteen ordering system\n3. Campus waste management using sensors\n4. Energy monitoring dashboard for classrooms\n\n**How to Register:**\n1. Form your team on Unify\n2. Post a hackathon invite with your skills needed\n3. Register via the link in the Hackathons section\n\n**Registration Deadline:** February 10, 2026\n\nQuestions? Comment below or DM @speakr_meera (Event Coordinator) 🚀`,
        days: 5,
      },
      {
        title: "🎓 Mentorship Program — Seniors & Juniors Connect!",
        body: `We're launching the **Unify Mentorship Program** connecting 2nd-year students with seniors from 3rd and 4th year!\n\n**How it works:**\n- Post your question in the **Mentorship** section\n- Seniors from your domain will answer within 24 hours\n- Mark answers as "Helpful" to reward contributors with bonus coins\n- Top mentors get featured on the leaderboard\n\n**Topics covered:**\n📌 Internship preparation\n📌 DSA & placement readiness\n📌 Project guidance\n📌 Research opportunities\n📌 Freelancing tips\n\n**Coins reward:** +3 coins per mentorship reply, +2 bonus if marked helpful!\n\nStart asking and start answering 💡`,
        days: 7,
      },
      {
        title: "🛒 Marketplace Rules & Safety Tips",
        body: `Before buying or selling on Unify Marketplace, please read these guidelines:\n\n**For Sellers:**\n- Use real photos of your actual item (no stock images)\n- Mention condition honestly (New / Like New / Good / Fair)\n- Set a fair price — overpricing leads to reports\n- Respond to buyer messages within 24 hours\n\n**For Buyers:**\n- Always inspect items before paying\n- Prefer on-campus transactions in public spaces\n- Use the "I'm Interested" button to initiate contact\n- Leave a review after purchase — it helps the community!\n\n**⚠️ Red Flags to Watch:**\n- Sellers asking for advance payment before meeting\n- Suspiciously low prices for high-value items\n- Sellers unwilling to meet on campus\n\nStay safe and happy trading! 🤝`,
        days: 10,
      },
      {
        title: "💼 Freelance Feature Launch — Offer Your Skills!",
        body: `The **Freelancing section** is now live on Unify!\n\nAny approved student can now list their services — from graphic design and video editing to coding help and content writing.\n\n**How to list your service:**\n1. Go to Freelance → Post a Service\n2. Add title, description, price, and portfolio images\n3. Set your delivery timeline\n4. Students will contact you via DM\n\n**Popular services already listed:**\n- 🎨 Logo & graphic design — from ₹299\n- 💻 Website development — from ₹1999\n- 📹 Reel & video editing — from ₹199\n- 📝 Assignment help — from ₹99\n- 🤖 AI-assisted PPT — from ₹299\n\nEarn while you study! Every completed order earns you coins and builds your campus reputation 🌟`,
        days: 14,
      },
      {
        title: "⚠️ Reminder: Fake Listings Will Result in Permanent Ban",
        body: `We've noticed an increase in fake marketplace listings and fraudulent freelance offers. This is a serious violation of our community guidelines.\n\n**Recent actions taken:**\n- 3 accounts permanently banned for marketplace fraud\n- 2 accounts suspended for fake freelancing listings\n- 8 listings removed for misleading descriptions\n\n**If you see something suspicious:**\n- Use the Report button on the listing or profile\n- DM any moderator directly\n- We respond to all reports within 12 hours\n\nUnify is built on trust. Protect it. 🛡️`,
        days: 18,
      },
      {
        title: "🌟 Coin Leaderboard — Top Students This Month!",
        body: `Congratulations to our most active students this month!\n\n**🥇 Top Contributors:**\n\n| Rank | Username | Coins | Activity |\n|------|----------|-------|----------|\n| 1 | @app_hemu | 500 | 12 posts, 3 services, 2 hackathons |\n| 2 | @design_chan | 415 | 8 designs, 15 community posts |\n| 3 | @speakr_meera | 380 | 20 mentorship replies |\n| 4 | @ml_gagan | 360 | 10 ML posts, 5 mentorship answers |\n| 5 | @pixel_abhi | 320 | 7 IoT projects shared, 3 marketplace |\n\n**How to earn more coins:**\n- 🏘️ Join community: +5 coins\n- ✍️ Post content: +2 coins\n- 🏆 Post hackathon invite: +5 coins\n- 💬 Mentorship reply: +3 coins\n- ⭐ Reply marked helpful: +2 bonus coins\n\nKeep contributing and climb the board! 🚀`,
        days: 20,
      },
      {
        title: "📢 VTU Results — Semester 1 (Dec 2025) Announced!",
        body: `VTU has officially announced the **Semester 1 results for December 2025** examinations.\n\n**How to check:**\n1. Visit vtu.ac.in → Student Login\n2. Enter your USN and date of birth\n3. Download your result PDF\n\n**Revaluation window:** December 15 – December 30, 2025\nFee: ₹500 per subject\n\n**Struggling with a subject?** Post in the Mentorship section — seniors from your branch are ready to help with difficult subjects.\n\n**Celebrating a good result?** Share your success story in the community feed! 🎊\n\nAll the best to everyone! Remember, one result doesn't define your journey 💙`,
        days: 25,
      },
      {
        title: "🔐 Account Security — Please Update Your Passwords",
        body: `We've upgraded our platform security infrastructure. As a precaution, we strongly recommend all users update their passwords.\n\n**Password best practices:**\n- Use at least 8 characters\n- Mix uppercase, lowercase, numbers, and symbols\n- Don't reuse passwords from other platforms\n- Never share your password with anyone, including moderators\n\n**How to update your password:**\nGo to Profile → Settings → Change Password\n\n**Note:** Moderators and admins will **never** ask for your password via DM. If anyone does, report it immediately.\n\nStay safe online! 🛡️`,
        days: 30,
      },
    ];

    const annIds: number[] = [];
    for (let i = 0; i < announcements.length; i++) {
      const ann = announcements[i];
      const authorId = modIds[i % modIds.length] ?? adminId;
      const r = await client.query(
        `INSERT INTO announcements(author_id,title,body,created_at)
         VALUES($1,$2,$3,NOW() - INTERVAL '${ann.days} days') RETURNING id`,
        [authorId, ann.title, ann.body]
      );
      annIds.push(r.rows[0].id);
    }

    // Announcement likes
    for (const aid of annIds) {
      const likers = pickN(userIds, randInt(4, 15));
      for (const lid of likers) {
        await client.query(
          `INSERT INTO announcement_likes(announcement_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
          [aid, lid]
        ).catch(() => {});
      }
    }

    // Announcement comments
    const annComments = [
      "This is exactly what we needed! Thanks for the update 🙌",
      "Great initiative! Looking forward to participating.",
      "Thanks for keeping us informed!",
      "Finally! Been waiting for this 🔥",
      "Will share this with my classmates.",
      "Super helpful, pinning this for reference.",
      "Appreciate the transparency from the team!",
      "Can we get more details about the timeline?",
      "This is amazing news for the campus community!",
      "Bookmarked. Very useful info here.",
    ];
    for (const aid of annIds) {
      const numComments = randInt(2, 6);
      for (let c = 0; c < numComments; c++) {
        const authorId = pick(userIds);
        await client.query(
          `INSERT INTO announcement_comments(announcement_id,author_id,body,created_at)
           VALUES($1,$2,$3,NOW() - INTERVAL '${randInt(0,20)} days')`,
          [aid, authorId, pick(annComments)]
        );
      }
    }
    console.log(`✅ Announcements: ${annIds.length} seeded with likes & comments`);
    console.log(`✅ All done! Usernames are now Reddit-style handles.`);

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
