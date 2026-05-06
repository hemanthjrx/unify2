import pg from "../../node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const questions = [
  {
    title: "How do I start preparing for campus placements in 5th semester?",
    body: "I'm currently in 5th semester CSE and have no idea where to begin for placements. Should I focus on DSA first or try to build projects? Most of my friends have already started but I feel completely lost. Any roadmap suggestions would be really helpful.",
    tags: ["placements", "dsa", "career"],
    solved: true,
    replies: [
      { content: "Start with DSA — it's the foundation for most tech interviews. Use Striver's SDE Sheet or LeetCode's Top 150. Aim for 2 problems a day consistently. After 2-3 months of that, pick up one project that solves a real problem. Interviewers love seeing projects with actual use cases rather than just todo apps.", helpful: true },
      { content: "Don't underestimate soft skills and resume building. I had decent DSA but almost lost an offer because my resume was poorly structured. Use a clean one-page format, quantify your achievements, and tailor it per company.", helpful: false },
      { content: "Join a study group! It's 10x easier when you solve problems together and hold each other accountable. Our college has a placement WhatsApp group — ask your seniors about it.", helpful: false },
    ],
  },
  {
    title: "Best resources for learning React from scratch?",
    body: "I know HTML, CSS, and basic JavaScript. I want to get into frontend development and everyone says React is the way to go. What's the best free resource to learn React properly in 2025? I've tried a few YouTube tutorials but they feel outdated.",
    tags: ["react", "frontend", "webdev"],
    solved: true,
    replies: [
      { content: "The official React docs at react.dev are genuinely excellent now — they were completely rewritten and are way better than most YouTube tutorials. Work through the 'Learn React' section and build the tic-tac-toe project. After that, Scrimba's React course is great for interactive practice.", helpful: true },
      { content: "After the basics, build something real — a weather app using an API, a blog with CRUD, anything. Theory only sticks when you're fighting real bugs at 2am 😂", helpful: false },
      { content: "I'd recommend pairing React with TypeScript from the start. It adds a tiny learning curve but saves you from so many runtime bugs and makes your code way more readable.", helpful: false },
    ],
  },
  {
    title: "How do I negotiate a stipend for an internship offer?",
    body: "I got an internship offer from a mid-sized product company offering ₹15,000/month for a 3-month summer internship. My friend got ₹25,000 at a similar company. Is it okay to negotiate? How do I do it without coming across as rude or ungrateful?",
    tags: ["internship", "salary", "career"],
    solved: true,
    replies: [
      { content: "Yes, always negotiate! Most companies expect it. Be polite and professional — something like: 'I'm really excited about this opportunity. Based on my research and the skill set I'm bringing, I was hoping we could discuss the stipend. Would ₹20,000 be possible?' The worst they say is no. They won't rescind an offer over a polite ask.", helpful: true },
      { content: "Leverage competing offers if you have them — 'I have another offer at X amount, but I'd prefer to join you if we can get closer to that.' Even if it's not exactly true (use carefully), it shifts the negotiation power.", helpful: false },
    ],
  },
  {
    title: "Is it worth doing competitive programming for placements?",
    body: "I see some people spending all their time on Codeforces and reaching Candidate Master, but I also see people getting placed at good companies without touching CP at all. Is competitive programming actually necessary or is LeetCode-style DSA enough for tech interviews?",
    tags: ["competitive-programming", "dsa", "placements"],
    solved: false,
    replies: [
      { content: "For most product companies including mid-tier ones, LeetCode-style DSA (Easy/Medium) is more than enough. CP is useful if you're targeting Google/Codeforces-heavy companies, olympiads, or if you genuinely enjoy it. Don't do CP just for placements — it's a massive time sink and the ROI isn't always there.", helpful: true },
      { content: "I'd say CP builds problem-solving intuition that makes LeetCode mediums feel easy. If you can spare 6 months, doing Codeforces div 2 A-C problems regularly will make you much faster and more confident in interviews.", helpful: false },
      { content: "FAANG companies still ask hard LeetCode/CP-style questions. If you're targeting Google, Meta, or similar, you'd want to do at least some CP or very hard LeetCode. For service companies like TCS/Infosys, basic aptitude is enough.", helpful: false },
    ],
  },
  {
    title: "How to manage college coursework and side projects simultaneously?",
    body: "I want to build projects and learn new tech but my college workload (assignments, lab records, internal exams) barely leaves me any time. I feel burnt out trying to do everything. How do seniors manage this balance?",
    tags: ["time-management", "productivity", "college"],
    solved: true,
    replies: [
      { content: "Timeblocking changed my life. I use a simple rule: college work from 9-5, personal projects from 8-10pm. Protect those 2 hours ruthlessly. Even 2 focused hours a day compounds massively over a semester — that's 120 hours of project time.", helpful: true },
      { content: "Merge them where possible. Do your mini projects and assignments ON technologies you actually want to learn. Instead of doing a Java servlet project, ask if you can use Node.js. Most professors don't care as long as you deliver.", helpful: false },
      { content: "Honestly, pick your battles. You don't need to ace every subject — focus heavily on 2-3 subjects that actually matter for your career and just pass the rest. Your time is limited, optimize ruthlessly.", helpful: false },
    ],
  },
  {
    title: "What's the difference between SQL and NoSQL and when should I use each?",
    body: "I've been using MySQL for my projects but I keep hearing about MongoDB in tutorials. I'm confused about when to use which. Can someone explain in simple terms with real examples?",
    tags: ["databases", "sql", "mongodb"],
    solved: true,
    replies: [
      { content: "Simple rule: SQL (MySQL, PostgreSQL) for structured, relational data where consistency matters — banking apps, e-commerce orders, anything with relationships. NoSQL (MongoDB) for flexible, schema-less data that changes often — logs, user activity, content that varies per document. For most CRUD apps as a student, PostgreSQL is the better choice to learn.", helpful: true },
      { content: "The 'NoSQL is faster' myth trips up a lot of students. PostgreSQL with proper indexes is extremely fast. Use the right tool for the job, not whatever YouTube is trending.", helpful: false },
    ],
  },
  {
    title: "How do I explain a gap in my resume if I didn't do internships in 2nd year?",
    body: "All my friends did internships in 2nd year but I was dealing with some personal stuff and couldn't. Now I'm in 3rd year and worried recruiters will ask about the gap. What should I say?",
    tags: ["resume", "career", "internship"],
    solved: false,
    replies: [
      { content: "Be honest but brief. Recruiters are human — saying 'I dealt with a personal situation that required my full attention' is perfectly acceptable. Then immediately pivot to what you've done since: 'Since then, I've built X projects and completed Y certifications.' Show growth, that's what they care about.", helpful: true },
      { content: "Use the gap productively now. Build 2-3 solid projects, get an open source contribution or two, maybe do a short online certification. By the time you interview, you'll have something concrete to point to and the gap won't matter.", helpful: false },
      { content: "Most interviewers won't even notice a gap in 2nd year — that's really common. The resume gap myth is overblown for freshers. Focus your energy on making your current profile strong.", helpful: false },
    ],
  },
  {
    title: "Which cloud platform should I learn first — AWS, Azure, or GCP?",
    body: "I want to add cloud skills to my resume. I see certifications for all three platforms but I don't know which one to invest time in. Which one has the best job market in India and which is easiest to start with?",
    tags: ["cloud", "aws", "devops"],
    solved: false,
    replies: [
      { content: "AWS has the largest market share in India by far — most job listings for cloud roles mention AWS. Start with AWS Certified Cloud Practitioner (CCP) for fundamentals, then Solutions Architect Associate. The free tier is generous enough to build real projects without spending money.", helpful: true },
      { content: "If you're in a college that has Microsoft tie-ups, Azure for Students gives you free credits. The AZ-900 cert is easier to pass than AWS CCP and looks good on a resume. But job demand is lower than AWS.", helpful: false },
    ],
  },
  {
    title: "How to write a cold email to a senior for referrals?",
    body: "I want to reach out to alumni on LinkedIn for referrals or advice but I don't know how to write without being awkward or spammy. I've sent a few messages before and got no reply. What's the right way to do this?",
    tags: ["networking", "linkedin", "career"],
    solved: true,
    replies: [
      { content: "Keep it short (under 100 words), be specific, and lead with value. Bad: 'Can you refer me to your company?' Good: 'Hi [Name], I'm [Your name], a CSE junior from [College]. I'm applying for SDE intern roles at [Company] and noticed you work there. I've built [specific project] using [tech]. Would you be open to a 15-minute chat or reviewing my resume?' People ignore vague asks but respond to specific, respectful ones.", helpful: true },
      { content: "Engage with their LinkedIn posts first before sending a message. Like, comment thoughtfully on 2-3 posts over a week. Then your message doesn't come out of nowhere and they recognize your name.", helpful: false },
      { content: "Don't ask for a referral in the first message — ask for advice or a resume review first. Build the connection, THEN ask for the referral. Most people are happy to refer someone who genuinely seemed interested in their story.", helpful: false },
    ],
  },
  {
    title: "Is a CGPA below 7 a dealbreaker for product companies?",
    body: "I have a 6.8 CGPA after 4 semesters. Some companies have 7.0 as a cutoff. Am I automatically filtered out? Is there any way to get past this or should I only target companies without CGPA cutoffs?",
    tags: ["cgpa", "placements", "career"],
    solved: false,
    replies: [
      { content: "Many product companies have dropped hard CGPA cutoffs in recent years. 6.8 is fine for startups and many mid-sized companies. Focus on building a strong project portfolio and GitHub profile — a candidate with 6.5 CGPA and 3 solid projects beats a 7.5 CGPA candidate with nothing to show any day.", helpful: true },
      { content: "For companies with hard 7.0 cutoffs (some MNCs do this), you won't make it past the automated filter. But there are hundreds of good companies without this filter. Target those and build your profile. One good offer at a product company is worth more than fighting CGPA battles.", helpful: false },
      { content: "Certifications and internships also help bypass CGPA filters in many cases. If you can show a paid internship certificate or a good open source contribution, some recruiters will overlook the number.", helpful: false },
    ],
  },
  {
    title: "What's the best way to learn Machine Learning as a beginner?",
    body: "I'm a 3rd year student interested in ML/AI. I know Python basics. I don't know whether to start with theory (Andrew Ng's course) or just dive into Kaggle. I feel overwhelmed by the number of resources available. Where should I start?",
    tags: ["machine-learning", "python", "ai"],
    solved: true,
    replies: [
      { content: "Do Andrew Ng's Machine Learning Specialization on Coursera (the new one with Python, not the old Octave one). It takes about 3 months at a steady pace and gives you the math intuition. Then do one Kaggle competition — even finishing one teaches you more than 10 tutorials.", helpful: true },
      { content: "Fast.ai's 'Practical Deep Learning for Coders' is excellent if you prefer a top-down approach — build something first, understand the theory later. It's completely free and very hands-on.", helpful: false },
      { content: "Don't skip the math — linear algebra and basic statistics. You don't need to go deep, but knowing what a matrix multiplication means and what a normal distribution is will make everything click much faster.", helpful: false },
    ],
  },
  {
    title: "How do I structure a project for my resume — what makes it stand out?",
    body: "I built a basic todo app, a weather app, and a simple blog. But I've heard that these are too common to impress recruiters. How do I make my projects actually stand out? What kind of projects get noticed?",
    tags: ["projects", "resume", "webdev"],
    solved: true,
    replies: [
      { content: "Three things make a project stand out: (1) Real users or real data — even 10 actual users is impressive. (2) Scale or complexity — deployed on cloud, uses an API, has auth and a DB. (3) It solves a real problem you had. A 'Hostel complaint tracking app for our college' beats a todo app every time because it shows initiative and real-world thinking.", helpful: true },
      { content: "Add a live demo link and a clean README with screenshots. So many students have great projects but zero documentation. Recruiters spend 30 seconds on your resume — make it easy for them to see what you built.", helpful: false },
      { content: "Contributing to open source is a cheat code. Even fixing typos in docs or small bugs shows you can navigate real codebases. A merged PR on a recognized repo impresses more than 5 solo todo apps.", helpful: false },
    ],
  },
  {
    title: "How to prepare for group discussions (GDs) in campus placements?",
    body: "I'm good technically but I freeze up in group discussions. I either don't speak at all or say something and immediately regret it. Companies like Infosys and Wipro have GDs. How do I get better at this before placement season?",
    tags: ["placements", "soft-skills", "communication"],
    solved: false,
    replies: [
      { content: "Practice with your friends — form a group of 6-8 and do mock GDs on random topics every week. Record it on your phone and watch yourself back. It's painful but incredibly effective. After 5-6 mock sessions, the real GD feels routine.", helpful: true },
      { content: "In a GD, quality > quantity. You don't need to speak 5 times — 2-3 well-structured points make more impact. Use the 'point-reason-example' structure: make your point, give a reason, support with an example. It makes you sound confident even if you're nervous.", helpful: false },
      { content: "Read one newspaper article every morning (The Hindu or Indian Express). GD topics are always current affairs or abstract topics. If you know the facts, confidence follows naturally.", helpful: false },
    ],
  },
  {
    title: "Should I use Git and GitHub for personal projects?",
    body: "I've been coding for a year but still just save files locally. My senior told me to use Git but it seems complicated. Is it really necessary for a student? What's the minimum I need to know?",
    tags: ["git", "github", "tools"],
    solved: true,
    replies: [
      { content: "Yes, absolutely necessary — not just for interviews but for your own sanity. Minimum you need: git init, git add, git commit, git push, git pull, and understanding branches. That's literally it for 90% of solo projects. Takes one afternoon to learn. GitHub also doubles as your public portfolio.", helpful: true },
      { content: "Learn git through the official GitHub Skills course — it's interactive and free. Alternatively, 'Git and GitHub for Beginners' by Colt Steele on YouTube is excellent and under 2 hours.", helpful: false },
    ],
  },
  {
    title: "How to crack the Infosys InfyTQ certification exam?",
    body: "I have my InfyTQ exam coming up next month. I've heard it's important for getting into Infosys's specialist stream. How hard is it? What topics should I focus on and is there any specific prep strategy?",
    tags: ["infytq", "infosys", "placements"],
    solved: false,
    replies: [
      { content: "InfyTQ has two parts: Foundation (Python + Java basics) and Specialist (data structures, problem solving). For Foundation, the Infosys iEvolve platform has sample questions — do all of them. For Specialist, focus on arrays, strings, and basic sorting/searching in Python. The questions aren't very hard — consistency beats cramming.", helpful: true },
      { content: "Time management matters a lot. Most people don't finish. Practice timed mock tests — set a 90-minute timer and attempt full mock tests. Speed comes from pattern recognition, not intelligence.", helpful: false },
      { content: "Join the InfyTQ student community on their portal — they share actual previous questions and the pattern barely changes year to year.", helpful: false },
    ],
  },
  {
    title: "Is it too late to start coding in 3rd year?",
    body: "I'm in 3rd year and just started learning programming seriously. Most of my batchmates have been coding since 1st year. I feel like I've already lost the race. Is there still hope to get a decent placement? I'm really demotivated.",
    tags: ["motivation", "placements", "beginners"],
    solved: true,
    replies: [
      { content: "Not even close to too late. I know people who cracked Amazon, Microsoft offers learning to code in 3rd year with zero prior experience. 12 months of consistent, focused effort (2-3 hours daily) is genuinely transformative. Stop comparing your timeline to others — start today. A year from now you'll wish you had.", helpful: true },
      { content: "3rd year is actually a great time because you have more direction and urgency than 1st years who take it casually. Use that urgency as fuel. Many toppers from 1st year get complacent. You can absolutely outwork them.", helpful: false },
      { content: "Set a 30-day challenge: solve 1 LeetCode easy per day, watch 1 tutorial video, and commit 1 thing to GitHub. At the end of 30 days, you'll be surprised how far you've come. Progress is slow until suddenly it isn't.", helpful: false },
    ],
  },
  {
    title: "What certifications are actually worth it for a CSE student?",
    body: "There are so many certifications out there — AWS, Google Cloud, Cisco, HackerRank, Coursera, etc. I don't have money to spend on all of them. Which ones are actually recognized by companies and worth investing in?",
    tags: ["certifications", "career", "cloud"],
    solved: false,
    replies: [
      { content: "Highest ROI certs for freshers: (1) AWS Cloud Practitioner — widely recognized, ~₹8,000 exam fee, often waived in college programs. (2) Google Data Analytics or IT Support cert on Coursera (free with NPTEL/financial aid). (3) Meta Frontend Developer cert. Avoid vendor-specific certs from small companies — stick to FAANG/Big Cloud names.", helpful: true },
      { content: "Free certifications from NPTEL are underrated — they're recognized by the government and many PSUs. If you're targeting govt-adjacent jobs or want something to fill a resume gap, NPTEL courses with exam are great.", helpful: false },
      { content: "HackerRank certifications (Python, SQL, Problem Solving) are free and show up nicely on LinkedIn. They're not game-changers but they're a quick win when you're building your profile from scratch.", helpful: false },
    ],
  },
  {
    title: "How to explain a failed project during an interview?",
    body: "I worked on a startup idea with friends that completely failed after 4 months. We ran out of motivation and the project got abandoned. I put it on my resume. Now I'm scared an interviewer will ask about it and I'll have to explain why it failed. What do I say?",
    tags: ["interview", "projects", "startups"],
    solved: true,
    replies: [
      { content: "This is actually a GREAT interview talking point if you frame it right. Interviewers love hearing about failures when candidates show learning. Structure it as: what you built, what went wrong (be honest and specific — 'we didn't validate the market', 'team alignment broke down'), and most importantly what you learned. Shows maturity, self-awareness, and real-world experience most candidates lack.", helpful: true },
      { content: "Don't be defensive or vague about it. 'We ran out of time' is a red flag. 'We built too much before talking to users and realized nobody actually wanted it' is a sign of a founder mentality. Own it confidently.", helpful: false },
    ],
  },
  {
    title: "How does hashing work and when should I use HashMap vs HashSet?",
    body: "I understand arrays and linked lists but hashing confuses me. I see HashMap and HashSet in interview questions all the time. Can someone explain the difference and give examples of when to use each?",
    tags: ["dsa", "java", "interview"],
    solved: true,
    replies: [
      { content: "HashMap stores key-value pairs (like a dictionary). HashSet stores only unique values (like a set in math). Use HashMap when you need to look up a value by key — e.g., counting frequency of characters in a string. Use HashSet when you just need to check if something exists — e.g., finding duplicates in an array. Both have O(1) average-case lookup.", helpful: true },
      { content: "Classic problems that use hashing: Two Sum (HashMap), Contains Duplicate (HashSet), Group Anagrams (HashMap with sorted string as key), Longest Consecutive Sequence (HashSet). Solve these 4 and hashing will feel natural.", helpful: false },
      { content: "One gotcha: HashMap and HashSet have O(n) worst case when there are hash collisions (rare but possible). In interviews, always mention the average case is O(1) but worst case is O(n) if the interviewer seems detail-oriented.", helpful: false },
    ],
  },
  {
    title: "What is system design and when should I start learning it?",
    body: "I keep hearing about 'system design interviews' for SDE roles. I have no idea what it means or how to prepare. Is it relevant for freshers or only for experienced engineers? Should I be learning it now?",
    tags: ["system-design", "interview", "career"],
    solved: false,
    replies: [
      { content: "System design is about designing large-scale software systems — think 'how would you design Twitter?' or 'design a URL shortener'. For freshers and interns, most companies don't ask deep system design — they might ask basic questions like 'how does a web request work' or 'explain REST APIs'. Start with the basics (HTTP, databases, caching, load balancing) in your 3rd year. Deep system design prep is for 2+ years of experience.", helpful: true },
      { content: "Primer resources for basics: 'System Design Primer' on GitHub (free, very comprehensive), and ByteByteGo newsletter. Don't buy expensive courses yet — the free resources are better than most paid ones for students.", helpful: false },
    ],
  },
];

async function seed() {
  const client = await pool.connect();

  try {
    // Get all user IDs
    const { rows: users } = await client.query("SELECT id FROM users WHERE role != 'admin' ORDER BY id");
    const userIds = users.map((u) => u.id);

    if (userIds.length < 5) {
      console.error("Not enough users found. Run seed-students first.");
      return;
    }

    // Clear existing mentorship data
    await client.query("DELETE FROM mentorship_replies");
    await client.query("DELETE FROM mentorship_questions");
    console.log("Cleared existing mentorship data.");

    let qCount = 0;
    let rCount = 0;

    const baseTime = new Date();
    baseTime.setDate(baseTime.getDate() - 30); // start 30 days ago

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      // Pick a random author (not meow's ID=26 to keep variety)
      const authorId = userIds[Math.floor(Math.random() * userIds.length)];

      // Timestamp: spread over last 30 days
      const qTime = new Date(baseTime.getTime() + i * (28 * 60 * 60 * 1000));

      const { rows: [inserted] } = await client.query(
        `INSERT INTO mentorship_questions (author_id, title, body, tags, is_solved, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [authorId, q.title, q.body, q.tags, q.solved, qTime]
      );

      qCount++;
      const qId = inserted.id;

      // Insert replies
      for (let j = 0; j < q.replies.length; j++) {
        const r = q.replies[j];
        // Pick a different user for reply
        let replyAuthorId;
        do { replyAuthorId = userIds[Math.floor(Math.random() * userIds.length)]; }
        while (replyAuthorId === authorId);

        const rTime = new Date(qTime.getTime() + (j + 1) * 3 * 60 * 60 * 1000); // 3h apart

        await client.query(
          `INSERT INTO mentorship_replies (question_id, author_id, content, is_helpful, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [qId, replyAuthorId, r.content, r.helpful, rTime]
        );
        rCount++;
      }

      // Award coins to helpful repliers
      if (q.solved) {
        await client.query(
          `UPDATE users SET coins = coins + 5 WHERE id IN (
            SELECT author_id FROM mentorship_replies WHERE question_id = $1 AND is_helpful = true
          )`,
          [qId]
        );
      }
    }

    console.log(`✅ Seeded ${qCount} questions and ${rCount} replies.`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => { console.error(e); process.exit(1); });
