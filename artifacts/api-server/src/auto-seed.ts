/**
 * auto-seed.ts
 * Runs once on first server launch to populate the DB with EWIT demo data.
 * Safe to re-run — checks for the "oghemz" marker user before inserting.
 * Source of truth: src/data/students.ts (160 hardcoded students + system accounts)
 */

import bcrypt from "bcrypt";
import { db, pool } from "@workspace/db";
import {
  usersTable,
  communitiesTable,
  communityMembersTable,
  postsTable,
  announcementsTable,
  mentorshipQuestionsTable,
  mentorshipRepliesTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { ALL_STUDENTS, SYSTEM_ACCOUNTS, SEED_MARKER_USERNAME } from "./data/students.js";
import { MARKETPLACE_LISTINGS, FREELANCE_LISTINGS } from "./data/marketplace-freelance.js";

// ─────────────────────────────────────────────
// (NAMED_USERS replaced by hardcoded dataset)
// See src/data/students.ts for all 160 students.
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// 20 COMMUNITIES (exact titles + descriptions)
// ─────────────────────────────────────────────
const COMMUNITIES = [
  {
    slug: "biohackers",
    name: "BioHackers",
    description: "Exploring the intersection of biology, engineering, and DIY synthetic biology.",
    accentColor: "#10b981",
    icon: "🧬",
    tags: ["biology", "synthetic-biology", "diy-science", "bioengineering"],
  },
  {
    slug: "eco-engineers",
    name: "Eco-Engineers",
    description: "A sustainability-focused group working on campus waste management and renewable solutions.",
    accentColor: "#22c55e",
    icon: "🌱",
    tags: ["sustainability", "environment", "renewable-energy", "campus"],
  },
  {
    slug: "finance-forge",
    name: "Finance Forge",
    description: "Bridging the gap between engineering and the stock market, crypto, and personal finance.",
    accentColor: "#f59e0b",
    icon: "💰",
    tags: ["finance", "stocks", "crypto", "investing", "personal-finance"],
  },
  {
    slug: "gaming-ground",
    name: "Gaming Ground",
    description: "A hub for E-sports, game design, and competitive gaming analysis.",
    accentColor: "#7c5cff",
    icon: "🎮",
    tags: ["gaming", "esports", "game-design", "competitive"],
  },
  {
    slug: "mental-wellness-collective",
    name: "Mental Wellness Collective",
    description: "A peer-led group dedicated to stress management and campus mental health awareness.",
    accentColor: "#ec4899",
    icon: "🧠",
    tags: ["mental-health", "wellness", "stress-management", "peer-support"],
  },
  {
    slug: "culinary-code",
    name: "Culinary Code",
    description: "Mastering the science of cooking and molecular gastronomy.",
    accentColor: "#f97316",
    icon: "🍳",
    tags: ["cooking", "food-science", "molecular-gastronomy", "culinary"],
  },
  {
    slug: "ethical-hacker-syndicate",
    name: "Ethical Hacker Syndicate",
    description: "Focused on penetration testing, cybersecurity defense, and data privacy.",
    accentColor: "#ef4444",
    icon: "🔐",
    tags: ["cybersecurity", "pentest", "ethical-hacking", "data-privacy"],
  },
  {
    slug: "venture-vanguard",
    name: "Venture Vanguard",
    description: "Helping students scale their side projects into actual startups.",
    accentColor: "#3b82f6",
    icon: "🚀",
    tags: ["startups", "entrepreneurship", "pitching", "business"],
  },
  {
    slug: "podcast-pioneers",
    name: "Podcast Pioneers",
    description: "A media production group dedicated to campus stories and technical education series.",
    accentColor: "#8b5cf6",
    icon: "🎙️",
    tags: ["podcasting", "media-production", "storytelling", "audio"],
  },
  {
    slug: "aero-drone-league",
    name: "Aero-Drone League",
    description: "Focused specifically on the flight mechanics and aerial photography of high-speed drones.",
    accentColor: "#06b6d4",
    icon: "🚁",
    tags: ["drones", "aerial-photography", "flight-mechanics", "UAV"],
  },
  {
    slug: "language-lab",
    name: "Language Lab",
    description: "A platform to learn foreign languages like German, Japanese, or French for global careers.",
    accentColor: "#14b8a6",
    icon: "🗣️",
    tags: ["languages", "german", "japanese", "french", "global-careers"],
  },
  {
    slug: "philosophy-tech",
    name: "Philosophy & Tech",
    description: "Discussing the ethics of AI, robotics, and the future of human existence.",
    accentColor: "#6366f1",
    icon: "🤔",
    tags: ["philosophy", "AI-ethics", "robotics", "future-of-humanity"],
  },
  {
    slug: "retro-tech-society",
    name: "Retro-Tech Society",
    description: "Restoring vintage hardware and understanding the history of computing.",
    accentColor: "#d97706",
    icon: "🖥️",
    tags: ["vintage-hardware", "computing-history", "restoration", "retro"],
  },
  {
    slug: "design-thinking-den",
    name: "Design Thinking Den",
    description: "A community focused on UX/UI design and product prototyping.",
    accentColor: "#e879f9",
    icon: "🎨",
    tags: ["ux-design", "ui", "prototyping", "product-design"],
  },
  {
    slug: "space-law-policy",
    name: "Space Law & Policy",
    description: "Discussing the regulations surrounding satellite launches and space exploration.",
    accentColor: "#1d4ed8",
    icon: "🛸",
    tags: ["space-law", "satellites", "policy", "space-exploration"],
  },
  {
    slug: "fashion-engineering",
    name: "Fashion Engineering",
    description: "Experimenting with wearable technology and smart fabrics.",
    accentColor: "#f43f5e",
    icon: "👗",
    tags: ["wearables", "smart-fabrics", "fashion-tech", "e-textiles"],
  },
  {
    slug: "adventure-alliance",
    name: "Adventure Alliance",
    description: "Organizing trekking, camping, and outdoor survival skills for students.",
    accentColor: "#84cc16",
    icon: "🏔️",
    tags: ["trekking", "camping", "outdoors", "survival-skills"],
  },
  {
    slug: "writers-block-breakers",
    name: "Writer's Block Breakers",
    description: "A collaborative space for technical writing, storytelling, and blogging.",
    accentColor: "#a78bfa",
    icon: "✍️",
    tags: ["technical-writing", "blogging", "storytelling", "content"],
  },
  {
    slug: "automotive-restoration",
    name: "Automotive Restoration",
    description: "Hands-on work on vintage car mechanics and modified engine performance.",
    accentColor: "#dc2626",
    icon: "🚗",
    tags: ["automotive", "vintage-cars", "engine", "mechanics"],
  },
  {
    slug: "civic-tech-action",
    name: "Civic Tech Action",
    description: "Applying engineering skills to solve local Bengaluru-specific urban infrastructure problems.",
    accentColor: "#0ea5e9",
    icon: "🏙️",
    tags: ["civic-tech", "urban-infrastructure", "bengaluru", "social-impact"],
  },
];

// ─────────────────────────────────────────────
// POSTS PER COMMUNITY (6-12 each)
// ─────────────────────────────────────────────
const COMMUNITY_POSTS: Record<string, string[]> = {
  "biohackers": [
    "Just got my CRISPR kit from the iGEM foundation. Starting with a simple GFP expression experiment this weekend. Anyone want to join?",
    "Great session on synthetic biology yesterday! The part about using E.coli to produce biofuel really blew my mind. Here are my notes: [shared on Drive]",
    "Has anyone here worked with plasmid cloning before? I'm struggling with transformation efficiency and my plates are coming out clean every time.",
    "Sharing this paper I found: 'DIY CRISPR: Safety, Ethics, and Access in Community Biolabs' — very relevant to what we're doing here.",
    "Our BioHackers team got selected for iGEM 2025! We're building a biosensor for detecting water contaminants. Need more biology folks!",
    "Reminder: bio-safety training workshop this Saturday 10am in lab 304. Mandatory for anyone handling live cultures.",
    "Ran my first gel electrophoresis today after three failed attempts. The bands are beautiful. Small wins matter.",
    "Does anyone know where to source DMSO and agar in Bengaluru without ordering online? Local supplier suggestions welcome.",
    "Reading: 'Regenesis' by George Church. If you're serious about synthetic biology, this book is non-negotiable.",
    "Proposal: Let's start a weekly journal club — pick a paper, read it, discuss it Friday evenings. Who's in?",
  ],
  "eco-engineers": [
    "Campus waste audit results are in: 67% of waste from the canteen is compostable. We're pitching a biogas plant proposal to the administration next week.",
    "Just installed our first solar-powered water pump in the college garden. Output: 18 liters/hour. Small but proof of concept.",
    "If anyone has data on Karnataka's solid waste management rules (SWM 2016), please share. We're referencing them in our proposal.",
    "Team update: the campus e-waste collection drive collected 43kg of old electronics. Sending them to E-Parisaraa for certified recycling.",
    "Interesting find: the hostel rooftop could generate enough solar power to run all corridor lights. Full analysis coming soon.",
    "We won the inter-college sustainability challenge! Our 'Smart Composting Unit' beat 28 other teams. Huge thanks to everyone involved!",
    "Proposal: Replace all plastic water cups in the canteen with edible ones made from rice flour. Cost analysis shows break-even at 4 months.",
    "Workshop recap — 'Circular Economy for Engineering Students' was really eye-opening. Slides uploaded in the group folder.",
    "Looking for volunteers for our tree-planting drive on March 21st. We need 30 people and have seedlings for 200 trees.",
    "New project: Installing greywater recycling in the men's hostel. Need civil engineering students. Mechanical and environmental welcome too.",
  ],
  "finance-forge": [
    "Market update: RBI kept repo rates unchanged at 6.5%. Here's what it means for interest-sensitive sectors — banks, NBFCs, and real estate.",
    "Finally finished my first DCF model for Infosys. Happy to share the spreadsheet template if anyone wants to learn how it's done.",
    "Crypto update: ETH gas fees are back below $2. Good time to experiment with testnet deployments if you're building DeFi stuff.",
    "Tax-saving season is here. For salaried interns and part-timers: Section 80C allows up to ₹1.5L deduction. Don't leave money on the table.",
    "Our simulated portfolio challenge kicks off Monday. Starting capital: ₹1,00,000 (virtual). Track your picks and we'll review monthly.",
    "Personal finance tip: The 50/30/20 rule is a good starting point — 50% needs, 30% wants, 20% savings. Tweak it for your situation.",
    "Fixed vs floating rate home loan — which is better right now? Here's my analysis given current RBI trajectory.",
    "Book recommendation: 'Coffee Can Investing' by Saurabh Mukherjea. Incredibly relevant for Indian markets and long-term wealth building.",
    "Just passed CFA Level 1! Three months of early mornings. Happy to answer questions for anyone planning to attempt it.",
    "Understanding option greeks with memes — session this Friday 6pm. Delta, Gamma, Theta explained without the textbook pain.",
    "The Nifty 50 vs Sensex argument is overrated. Both are highly correlated. What matters is your index fund expense ratio — keep it under 0.1%.",
  ],
  "gaming-ground": [
    "BGMI tournament signup is open! Double-elimination format, 8 teams max. Prize pool: ₹3000. Register before Sunday.",
    "Our Valorant team just went 3-0 in the inter-college league. Agent draft strategy was the difference-maker — details in the recap thread.",
    "Game dev update: Our Unity project 'Campus Escape Room' hit 500 playtests on itch.io. It's buggy but people are finishing it!",
    "Discussion: Is Hollow Knight the best indie game of the decade? Making the case — please fight me.",
    "Anyone using a controller for PC gaming? Share your Steam Input config. I've been tweaking mine for FPS games and it's surprisingly good.",
    "LAN party at the networking lab on Friday evening. Bring your laptops. CS2 and Street Fighter 6 confirmed. Maybe Rocket League.",
    "Game design question: How do you balance difficulty in a puzzle game without making it feel hand-holdy? Working on a level progression system.",
    "Streaming setup guide I wrote for beginners: OBS, proper bitrate settings, scene transitions. DM for the link.",
    "E-sports career panel happening next Thursday — pro player, team manager, and a gaming journalist on the call. Link will be shared.",
    "Hot take: The best way to learn game programming is to just clone a game. I cloned Flappy Bird in 3 hours. Here's what I learned.",
    "Anyone interested in a college-level chess.com team? We can do blitz tournaments during lecture breaks.",
    "Indie game dev jam this month. Theme: 'Connection'. 72 hours. Tools: any. Team size: 1-3. Who's forming teams?",
  ],
  "mental-wellness-collective": [
    "Reminder: this is a safe space. Everything shared here stays here. Support each other.",
    "Semester exam anxiety is real. Three techniques that actually helped me: box breathing, the Pomodoro method, and journaling before sleep.",
    "Sharing this: 'How to stop catastrophizing before exams' — short article, very practical. It helped me a lot last semester.",
    "Open thread: What does burnout feel like for you? I'll start — for me it feels like working all day and feeling like I've done nothing.",
    "Wellness Wednesday reminder: 30-minute group walk around the campus lake at 6pm. No phones. No talk about assignments.",
    "The iCall helpline (9152987821) is free, anonymous, and run by TISS. Please save this number. You don't need to be in crisis to call.",
    "Hot take: Productivity culture is overrated. You do not need to optimize every minute of your day. Rest is not laziness.",
    "Just want to say — I failed two internals this semester and I'm still here. It's not the end. Keep going.",
    "Yoga and meditation club meeting every Tuesday 7am, college multipurpose hall. All levels welcome. It takes 45 minutes and your day feels different.",
    "Book rec: 'The Anxious Generation' by Jonathan Haidt. Heavy read but explains a lot about why this generation is struggling.",
  ],
  "culinary-code": [
    "Made spherified mango juice using sodium alginate and calcium chloride yesterday. Food science is wild. Photo in the album.",
    "Recipe: Cold brew coffee using a 12:1 water-to-coffee ratio, coarse grind, 18 hours in the fridge. No bitterness, incredible smoothness.",
    "The chemistry of caramelization — why sugar turns brown at 170°C and how Maillard reaction at 140°C creates savory flavors.",
    "Anyone tried making their own sourdough starter? Day 7 update: it's finally bubbling. My starter is named 'Compilo'.",
    "Cooking workshop recap: We made emulsified vinaigrette using xanthan gum. The stability is 10x better than a regular hand-whisked dressing.",
    "Hot take: MSG is not bad for you. It's sodium salt of glutamic acid, the same compound in tomatoes and parmesan. The 'Chinese restaurant syndrome' was debunked.",
    "Wanted: Roommates who cook. Shared cooking sessions every Sunday, everyone contributes one dish. Hostel block C, message me.",
    "Molecular gastronomy supply list for Bengaluru: Agar agar (Nature's Basket), Carrageenan (Amazon), Lecithin (pharmacy). Sodium alginate is the hardest to find.",
    "The science of resting meat after cooking — myoglobin redistribution, moisture retention, and why cutting too early ruins your steak.",
    "Food tech idea: a calorie tracker that scans Indian thali and identifies each component. OpenCV + nutrition database. Someone build this.",
    "Fermentation deep dive this Saturday. We'll make kombucha, kimchi, and idli batter from scratch. Understanding the microbiology is the goal.",
  ],
  "ethical-hacker-syndicate": [
    "CTF recap: We placed 4th in HackTheBox University CTF. The crypto challenge with lattice-based crypto got us — need to study LLL algorithm.",
    "Beginner resource thread: picoCTF > TryHackMe > HackTheBox > OSCP. This is the path. Don't skip steps.",
    "Responsible disclosure: Found an IDOR vulnerability in a popular college portal. Reported it, they fixed it in 48 hours. No bug bounty though 😅",
    "Reading: 'The Web Application Hacker's Handbook' — old but the core OWASP concepts in it are still 100% relevant.",
    "SQL injection is still #3 in OWASP Top 10. Here's a hands-on demo using DVWA and sqlmap. For educational purposes only.",
    "Network scanning workshop notes: using nmap for host discovery, service enumeration, and OS fingerprinting. PDF in the Drive folder.",
    "Metasploit module I wrote for our internal lab: scans for unpatched SMBv1 on local subnet. Works for educational demos only.",
    "Privacy tip: Stop using SMS for 2FA. Switch to TOTP (Google Authenticator, Aegis). SMS is vulnerable to SIM swapping.",
    "Kali Linux setup guide for college laptops — minimal install, essential tools, VPN setup for CTF platforms. DM for the doc.",
    "Job alert: Razorpay has a bug bounty program with payouts up to $10,000. Scope includes their API endpoints. Go find something!",
    "Podcast recommendation: Darknet Diaries by Jack Rhysider. Episode 100 onwards is gold for understanding real-world social engineering.",
  ],
  "venture-vanguard": [
    "Our first Venture Vanguard demo day was a massive success! 8 teams pitched, 2 got interest from angel investors. Recap thread below.",
    "Tool stack for early-stage student startups: Notion (PM), Linear (dev), Vercel (hosting), Stripe (payments), Resend (email). All free tiers are generous.",
    "Book of the month: 'Zero to One' by Peter Thiel. Agree or disagree with his takes, it'll force you to think about monopolies and competition differently.",
    "Legal tip: Register your startup as LLP or Pvt Ltd before raising money. A handshake agreement between co-founders causes 80% of startup deaths.",
    "Anyone want to join a weekly accountability circle? 3-4 founders, share weekly goals on Monday, review on Friday. DM if interested.",
    "Customer discovery tip: Don't ask 'would you use this?'. Ask 'tell me about the last time you faced this problem'. The second question gets real answers.",
    "Looking for a co-founder: I have a working MVP for a B2B SaaS tool for mess/canteen management. Need someone with sales/BD experience.",
    "Startup validation in 2 weeks: built a landing page, ran ₹500 Google Ads, got 47 signups. That's enough signal to build the first version.",
    "Funding update: Meesho's early story is insanely relevant for student founders. They pivoted 3 times. Persistence over original idea.",
    "Just got our startup registered on DPIIT Startup India portal. Tax benefits and easier compliance. Every student startup should do this.",
  ],
  "podcast-pioneers": [
    "Episode 12 is live! 'How to Land a Google Internship as a Tier-2 College Student' — 38 minutes, three guests, zero fluff. Link in bio.",
    "Audio quality tip: Record in a wardrobe full of clothes. Clothes absorb sound reflections better than any budget foam panel.",
    "We're looking for guests for our 'First Job Stories' series. If you have a placement story — good, bad, or weird — DM me.",
    "Gear on a budget: Blue Snowball mic + Audacity + Krisp.ai for noise cancellation. This is all you need to start a decent podcast.",
    "Episode idea thread: What topics do you want to hear about? Vote: [Entrepreneurship] [Mental Health] [Research & Academia] [Technical Deep Dives]",
    "Post-production workflow: Audacity for cutting, Auphonic for leveling, Anchor for distribution. Total time per episode: ~3 hours.",
    "Interview tip: Send your guest the questions 2 days in advance. They'll give better, more thoughtful answers. The podcast sounds smarter.",
    "Our episode on 'Open Source in India' crossed 1,000 plays! That's a milestone for a 3-month-old college podcast. Thank you all.",
    "Looking for a script editor and show notes writer. Paid role (₹200/episode). Must be able to condense 40 minutes to 200 words.",
    "Podcast vs YouTube: Why we chose audio-only for our first year. Lower production barrier, faster iteration, better for commuters.",
  ],
  "aero-drone-league": [
    "Race day results: CyberKnight's frame hit 84 km/h on the straight before clipping the gate. Video in the album — the crash at 0:43 is painful.",
    "Build thread: My 5-inch freestyle quad — Nazgul frame, F7 FC, 2306 motors. Total cost: ₹12,000. Photos and parts list attached.",
    "Regulations update: DGCA RPAS rules require UAS operator permit for anything above 250g. We need to stay compliant at events.",
    "Betaflight PID tuning basics — I-term, P-term, D-term explained for beginners. Stop copying tunes from YouTube and learn to tune your own.",
    "Looking for a FPV goggles recommendation under ₹8000. Currently torn between Eachine EV800D and older DJI Goggles. Opinions?",
    "Mapping project update: We completed aerial photogrammetry of the entire college campus using our mapping drone. The 3D model is stunning.",
    "Warning: Flying near NIMHANS is restricted airspace. Two members got stopped by police last week. Know your no-fly zones.",
    "Propeller physics: why 5-inch tri-blade props are better for freestyle but bi-blade 5-inch props win on efficiency for long-range.",
    "Club fund vote: Do we spend ₹25,000 on a new GPS long-range plane, or upgrade our racing drone fleet? Poll open till Sunday.",
    "Workshop: Soldering and drone assembly basics — next Saturday 10am. Bring your own iron if you have one. Solder and flux provided.",
  ],
  "language-lab": [
    "Duolingo streak doesn't mean fluency. Here's why immersion + conversation practice beats app-based learning every time.",
    "Japanese corner: learned 20 new N5 vocab words this week. Flashcard deck link in the description. Quiz each other on Friday!",
    "German class update: We covered Konjunktiv II this week — the German subjunctive. It's brutal but essential for B2 level.",
    "Language exchange pairing: We have 4 Japanese students who want to practice English. 4 of us want to practice Japanese. Let's match!",
    "Best free resource for French: Radio France Internationale (RFI) has a 'Journal en Français Facile' — slow news in simple French.",
    "Why learning a language increases job prospects: Japanese and German companies in Bengaluru (Bosch, Siemens, Toyota) offer 20-30% salary premiums for L2 speakers.",
    "Week 6 challenge: Hold a 2-minute conversation in your target language. Record it, share it here for feedback. No judgment, only support.",
    "Spanish is the easiest language for English speakers. Italian is the most phonetically consistent. Mandarin is the most systematically logical. Fight me.",
    "Our Language Lab YouTube channel is live! First video: '30 Essential German Phrases for Engineering Interns at German Companies'.",
  ],
  "philosophy-tech": [
    "Is it ethical to build AI systems that optimize for engagement when we know engagement often correlates with outrage? Discuss.",
    "Paper: 'The Alignment Problem' by Brian Christian. Essential reading for anyone building AI systems. What does it mean for a machine to 'want' something?",
    "Do autonomous vehicles create a moral hierarchy? If the car must choose between hitting a pedestrian or its passenger, who decides the algorithm?",
    "Thread: Techno-optimism vs techno-pessimism. Bill Gates, Sam Altman, and Marc Andreessen are optimists. Nick Bostrom and Yuval Harari are skeptics. Who's right?",
    "Discussion recap: We covered Rawls' veil of ignorance applied to algorithmic bias. Would you design an AI system if you didn't know which race/gender you'd be classified as?",
    "Hot take: The 'move fast and break things' ethos is a moral failure. The things being broken are societies, democracies, and human attention spans.",
    "Are we closer to the Ship of Theseus paradox than we think? Every neuron in your brain replaced over time. Are you the same person you were 7 years ago?",
    "Reading group this week: Cathy O'Neil's 'Weapons of Math Destruction'. We'll focus on chapters 4-6 on justice system algorithms.",
    "Philosophy of consciousness: Does a sufficiently advanced AI experience qualia? Can a Chinese Room ever truly 'understand' language?",
    "The paperclip maximizer thought experiment — why goal-directed AI with misspecified objectives is genuinely dangerous even without malicious intent.",
  ],
  "retro-tech-society": [
    "Rescued a 1988 IBM PS/2 from a scrapyard. It boots. The 5.25-inch floppy drive still spins. I'm crying a little.",
    "DOS Bootcamp this Sunday: We'll run MS-DOS 6.22 from a USB drive, write batch files, and play the original Wolfenstein 3D.",
    "Technical teardown: Why the Commodore 64 was architecturally ahead of its time — the SID chip alone was a marvel of analog synthesis.",
    "Project: I'm building a working Apple I replica from a PCB kit. Sourcing the 6502 processor was the hardest part. Found one in Ritchie Street, Chennai.",
    "The Unix philosophy explained with a 1969 perspective: 'Do one thing and do it well.' How different would software be today if we still followed it?",
    "Wanted: Old circuit boards, keyboards, CRT monitors, or any vintage computing equipment. We restore and display them. DM.",
    "Why punched cards were more resilient than you think — the physical medium outlasted many early magnetic storage formats.",
    "Repair log: Fixed a 1992 Compaq LTE laptop. Bad capacitors on the motherboard. Replaced 8 caps, it now runs Windows 3.1 perfectly.",
    "The history of BASIC: how a beginner's language accidentally became the gateway for an entire generation of programmers.",
    "Question: Is restoring vintage hardware preservation or nostalgia? Can it be both? What's the point if no one new learns from it?",
  ],
  "design-thinking-den": [
    "Shared my Figma prototype for the campus lost-and-found app. Feedback welcome — especially on the object search UX.",
    "The double-diamond design process in practice: discovery, define, develop, deliver. Here's how we applied it to a hostel room booking flow.",
    "UX research tip: 5 users in usability testing is enough to find 85% of problems. Stop over-recruiting. Start iterating.",
    "Hot debate: Should designers code? My take — you don't need to write production code, but you need to understand constraints. CSS literacy is enough.",
    "Typography deep dive: Why Inter became the default for digital products, and when to reach for a display typeface instead.",
    "Design critique session recap: We reviewed 6 student projects. Key theme — everyone overloads their first screen. Let users breathe.",
    "Resource: Refactoring UI by Adam Wathan and Steve Schoger. ₹3,500 but worth every rupee. Teaches you to make things look professional.",
    "Accessibility checklist I built for our projects: contrast ratio 4.5:1 minimum, ARIA labels on all interactive elements, keyboard navigation tested.",
    "Our team won the UX design challenge at Designathon 2025! The problem: redesign the BESCOM (electricity board) bill payment flow. Before/after comparison attached.",
    "Prototyping tools ranked for students: Figma (best overall) > Penpot (open source) > Adobe XD (legacy) > Sketch (Mac only). Don't overthink the tool.",
    "Design system workshop: Building a component library in Figma with tokens. Spacing scale, color system, and typography hierarchy from scratch.",
  ],
  "space-law-policy": [
    "India's Space Activities Bill is still pending in Parliament. Here's what it means for private launch companies like Agnikul and Skyroot.",
    "Case study: The 2009 Iridium-Cosmos collision created 2,000+ debris fragments. Who is legally responsible? Outer Space Treaty Article VI says 'launching state'.",
    "Discussion: Should moon resources be ownable? The Artemis Accords (2020) say yes. The Moon Agreement (1979) says no. India signed neither.",
    "SpaceX has 6,000+ Starlink satellites. ITU coordination rules were designed for dozens of satellites. The regulatory framework is completely broken.",
    "Reading: 'The Artemis Accords: Origins, Principles and Prospects' — PDF shared in the group. Key reading for understanding current space governance.",
    "Hot topic: India's IN-SPACe authority is processing applications for private satellite launches. Opportunity for student teams to understand the process.",
    "Question: Can a university student legally own a CubeSat in orbit? The answer is more complicated than you'd expect.",
    "Debris mitigation: Any satellite above 400km should deorbit within 25 years per IADC guidelines. SpaceX's Starlink at 550km complies. Traditional geostationary doesn't.",
    "Guest speaker this Friday: Patent attorney specializing in space technology IP. Q&A session after the talk.",
  ],
  "fashion-engineering": [
    "Progress update: Our conductive thread prototype can now transmit ECG data from a smart shirt to a phone via Bluetooth LE. Accuracy is within 5% of a clinical device.",
    "Material science: The difference between e-textiles and wearables. E-textiles integrate electronics into the fabric itself. Wearables attach hardware externally.",
    "Sourcing conductive thread in India: Shieldex from Germany is the gold standard. Domestically, try Bengaluru's Chickpet market — they sometimes stock silver-coated yarn.",
    "Project idea: A haptic feedback vest for blind users that converts visual information from a camera into tactile patterns. Looking for team members.",
    "Fashion week observation: Iris van Herpen's 3D-printed couture is basically applied materials science. The line between fashion and engineering is already blurring.",
    "Technical challenge: waterproofing flexible electronics while maintaining breathability in fabric. Current best solution: Parylene coating. Open to alternatives.",
    "Reading: 'Fashionable Technology' by Sabine Seymour. Bit dated (2008) but lays the foundational vocabulary for this field.",
    "Smart fabric sensor calibration — how to account for stretching and washing cycles in your data. Paper shared in the folder.",
    "Wanted: Textile engineering students to collaborate. We have the electronics, we need people who understand weave patterns and fabric behavior.",
  ],
  "adventure-alliance": [
    "Kudremukh trek debrief: 14km, 1894m elevation. 8 members completed. No incidents. The rain made it harder but the mist at the top was worth it.",
    "Packing list for a weekend Himalayan trek at 3000m+: 10 essential items everyone gets wrong. Thread below.",
    "First aid workshop this Saturday — focus on altitude sickness recognition and treatment, blister management, and sprain wrapping.",
    "River crossing safety: Never cross above knee height alone. Always face upstream. Have a throw bag ready on the bank. Don't underestimate flow.",
    "Coorg camping trip next month — Talacauvery campsite. Cost: ₹1,200/person including tents, meals, and bonfire. Spots limited to 12.",
    "Leave No Trace principles: pack out everything you pack in. We left the Skandagiri trail cleaner than we found it last weekend.",
    "Wilderness navigation: Reading a topographic map is a skill every trekker should have. Compass + topo beats GPS when your phone dies.",
    "Recommendation: Join a proper mountaineering course at Nehru Institute of Mountaineering (Uttarkashi) before attempting anything above 4000m.",
    "Photography tip from the Shivagange trek: golden hour at altitude hits different. Pack extra batteries — cold temperatures drain them faster.",
  ],
  "writers-block-breakers": [
    "First draft is always trash. That's the point. Stop trying to write a perfect first sentence and just write any sentence.",
    "Technical blog post workshop: How to structure a '5-minute read' that actually teaches something. Template shared — use it for your next post.",
    "My article 'How I passed GATE in 4 months' got 12,000 reads on Medium. Happy to share the monetization strategy and writing structure.",
    "Prompt of the week: Write a story that starts with 'The server went down at 3am, and no one knew why.' 500 words. Share here by Friday.",
    "Grammar pet peeve thread: 'less' vs 'fewer', 'affect' vs 'effect', and the apostrophe in 'it's'. Let's settle these once and for all.",
    "Guest post opportunities for students: GeeksforGeeks pays ₹500-₹2000 per accepted article. Analytics Vidhya has a similar program. Start your tech writing career now.",
    "Reading recommendation: 'On Writing' by Stephen King. Not just for fiction writers — the advice on editing and brevity applies to technical writing too.",
    "The Feynman technique applied to writing: if you can't explain it simply, you don't understand it well enough to write about it.",
    "Blog challenge: Document one thing you learned this week. Even 200 words. Publish it. Link it here. The habit of writing publicly changes how you learn.",
    "Anyone else use Obsidian for writing? My linked notes system means I never lose a good idea. Happy to share my vault structure.",
  ],
  "automotive-restoration": [
    "Project update: The 1972 Yezdi engine is disassembled. Bore is within spec but the piston rings need replacement. Parts sourced from a shop in Dharwad.",
    "Carburetor tuning on a vintage Royal Enfield Bullet: air-fuel mixture screw, idle speed, and float level. Photo tutorial uploaded.",
    "Hot tip: WD-40 is not a lubricant. It's a water displacer. Use proper machine oil on moving parts. This confusion destroys more engines than rust does.",
    "Our team rebuilt a 1989 Yamaha RX100 engine from scratch. Before and after dyno numbers: 8.2 BHP stock, 11.1 BHP after port work and re-jet.",
    "Wanted: Any old motorcycle in any condition for restoration project. Will travel within 100km of Bengaluru. DM with photos and price.",
    "Paint restoration workshop: Using 1000, 1500, 2000 grit wet-sand followed by compound and polish. The Fiat Padmini we worked on looks factory fresh.",
    "Rust treatment debate: POR-15 vs Rust-Oleum vs Naval Jelly. Testing all three on identical steel samples this weekend. Results Sunday.",
    "Understanding vintage wiring: Points ignition, coil, capacitor — how they work together and why solid-state CDI conversions improve reliability.",
    "Electrical gremlins on the '68 Ambassador: traced a mysterious drain to the original clock motor. These old cars are both terrifying and brilliant.",
  ],
  "civic-tech-action": [
    "Project live: Our 'BLR Road Damage Tracker' app has 340 reports in the first week. BBMP has acknowledged 12 of them. Slow but it's working.",
    "Open data source: data.gov.in has ward-level data for Bengaluru including population density, water supply, and sanitation coverage. Let's use it.",
    "Tech stack for our pothole reporting app: Next.js frontend, Express API, PostGIS for geospatial queries, Mapbox for visualization. Full open-source.",
    "Community meeting recap: Spoke with 3 BBMP corporators about integrating our ward data dashboard into their workflows. Two were genuinely interested.",
    "Reading: 'Invisible Cities' by Italo Calvino. Not a tech book, but it'll change how you think about urban space and infrastructure.",
    "Problem we want to solve: Bengaluru's drainage map is not publicly available. We're crowd-sourcing it using GPS coordinates from volunteers.",
    "Bus route optimization project: Using BMTC ridership data (accessed via RTI) and ML clustering to propose 3 new high-demand routes in Whitefield.",
    "Volunteer call: We need people to do physical surveys in Hebbal and Yelahanka wards. Document infrastructure issues with photos and GPS tags.",
    "Policy update: Karnataka has a new GIS-based infrastructure management system. We submitted a request to access the API for our research.",
    "Success story: The overflowing storm drain near RVCE main gate was fixed after our report went viral on Twitter. Civic tech works.",
  ],
};

// ─────────────────────────────────────────────
// 4 ANNOUNCEMENTS (2 admin, 2 moderator)
// ─────────────────────────────────────────────
const ANNOUNCEMENTS = [
  {
    isAdmin: true,
    title: "Semester-End Compliance: Submit ID Verification Before June 30",
    body: `All student accounts must complete ID verification before June 30th to remain active for the next semester.\n\nPlease upload your college ID card and fee receipt in your profile settings under 'Account Verification'. Accounts not verified by the deadline will be temporarily suspended until verification is complete.\n\nThis is a mandatory requirement per the Unify platform policy for institutional accounts. For any issues, contact support through the Help Center.\n\nThank you for keeping our platform trustworthy and safe for everyone.`,
  },
  {
    isAdmin: true,
    title: "HackSprint 2025 — National Student Hackathon: Registration Now Open",
    body: `We're thrilled to announce that Unify is officially partnering with HackSprint 2025, India's largest student hackathon!\n\n📅 Dates: August 2–4, 2025\n📍 Venue: NIMHANA Convention Centre, Bengaluru\n🏆 Prize Pool: ₹5,00,000 across 6 tracks\n\nTracks:\n• AI/ML for Social Good\n• Civic Tech & Urban Infrastructure\n• EdTech Innovation\n• FinTech for Bharat\n• Healthcare Engineering\n• Open Innovation\n\nTeam size: 2–4 students. Register through the Unify platform and we'll handle team formation assistance, mentor matching, and travel reimbursement for outstation participants.\n\nRegistration closes July 20th. Spots are limited to 200 teams.`,
  },
  {
    isModerator: true,
    title: "Community Posting Guidelines Reminder — Please Read",
    body: `Hey everyone,\n\nAs the community continues to grow, we want to remind all members of our posting standards:\n\n✅ DO:\n• Share knowledge, resources, and project updates\n• Ask questions with context and what you've tried\n• Credit original authors when sharing external content\n• Be constructive in feedback and critiques\n\n❌ DON'T:\n• Spam promotional content or affiliate links\n• Post academic dishonesty resources (assignment answers, exam papers)\n• Share personal contact details of other members without consent\n• Use this platform for buying/selling — use the Marketplace section for that\n\nViolations will result in a 3-strike system: warning → 7-day suspension → permanent ban. We want to keep this a high-quality space for serious students.\n\nThank you for being awesome! 🙏`,
  },
  {
    isModerator: true,
    title: "Marketplace Safety Tips — Avoid Getting Scammed",
    body: `With the Marketplace section growing, we've received a few reports of scam attempts. Here's how to stay safe:\n\n🔴 Red Flags:\n• Sellers who ask for payment via Google Pay before showing the product\n• Prices that seem too good to be true (₹500 laptop 🚩)\n• Accounts created within the last 7 days with no community activity\n• Requests to move conversation off-platform to WhatsApp immediately\n\n🟢 Safe Practices:\n• Always meet in a public campus location for physical goods\n• Use the Unify escrow system for transactions above ₹500\n• Check seller reputation score and community activity before buying\n• Report suspicious listings using the flag button — our team reviews them within 24 hours\n\nWe've removed 3 fraudulent listings this week and banned the accounts involved. Stay vigilant and report anything suspicious.`,
  },
];

// ─────────────────────────────────────────────
// 10 MENTORSHIP QUESTIONS WITH REPLIES
// ─────────────────────────────────────────────
const MENTORSHIP_QA = [
  {
    title: "How do I build a resume when I have no internship experience?",
    body: "I'm in my 4th semester with no formal internship experience. I've done some personal projects and contributed to one open-source repo. Every job posting says 'experience required' but how do I get experience without experience? How should I structure my resume?",
    tags: ["resume", "placements", "beginners"],
    isSolved: true,
    authorIdx: 4, // GhostWriter
    replies: [
      {
        authorIdx: 9, // StarDevGirl
        content: "Your projects ARE your experience at this stage. Here's the structure that worked for me: Header → Summary (2 lines max) → Skills → Projects (this is your biggest section) → Education → Links.\n\nFor each project, write 2-3 bullet points using the STAR format adapted for projects: what you built, the tech stack, and one measurable outcome. 'Built a React dashboard that reduced report generation time by 60%' is infinitely better than 'Built a React dashboard'.\n\nAlso, contribute to OSS even in small ways. A good PR to a popular repo on your resume is worth more than many personal projects. Start with good-first-issue tags on GitHub.",
        isHelpful: true,
      },
      {
        authorIdx: 3, // NinjaCoder
        content: "Two things that nobody tells you: (1) The 'experience' most JDs ask for is a hiring manager's wishlist, not a hard requirement. Apply anyway. (2) Competitive programming rankings are a valid substitute. A LeetCode profile with 200+ medium problems tells a recruiter you can think algorithmically — that matters more than an internship at a random startup.\n\nFor your resume, put a live link to every project. A recruiter who clicks and sees a working app will overlook your lack of an internship stamp.",
        isHelpful: true,
      },
      {
        authorIdx: 17, // WebNinja
        content: "Honest advice: a portfolio website is non-negotiable for developers now. Buy a domain for ₹800/year, use Vercel for free hosting, and put your projects there with descriptions and live demos. The URL on your resume does more work than any bullet point. I got my first internship because a recruiter spent 15 minutes on my portfolio site before my phone interview.",
        isHelpful: false,
      },
    ],
  },
  {
    title: "What's the fastest way to get from 'can code' to 'can crack DSA interviews'?",
    body: "I can write code and I understand the basics of arrays, strings, and linked lists. But I freeze during interview-style problem solving, especially under time pressure. I have a campus placement drive in 6 months. What's the realistic path from here to being interview-ready?",
    tags: ["DSA", "placements", "interview-prep"],
    isSolved: true,
    authorIdx: 0, // CyberKnight
    replies: [
      {
        authorIdx: 3, // NinjaCoder
        content: "6 months is enough time if you're consistent. Here's the exact roadmap I followed:\n\nMonth 1-2: Arrays, Strings, Hashing, Two Pointers, Sliding Window. Do 3-4 problems per day minimum. Use NeetCode150 as your problem list — it's curated by topic.\n\nMonth 3: Trees, Graphs, BFS/DFS. This is where most people get filtered. Spend extra time here.\n\nMonth 4: Dynamic Programming. Start with 1D DP, then 2D. Blind 75 has the essential ones.\n\nMonth 5: Heaps, Tries, Bit Manipulation. Polish the harder variants.\n\nMonth 6: Timed mock sessions only. LeetCode contest every Sunday. Review all your tagged problems.\n\nAbout freezing: it's a practice problem, not a intelligence problem. You freeze because you haven't practiced thinking aloud. Do every LeetCode problem by writing your approach in comments before coding. Say your thought process out loud alone if needed.",
        isHelpful: true,
      },
      {
        authorIdx: 9, // StarDevGirl
        content: "One thing that changed everything for me: after solving a problem, always look at the 2-3 most upvoted solutions even if yours passed. Understanding multiple approaches to the same problem builds your mental model for new problems. The goal isn't to solve 500 problems — it's to deeply understand 150 patterns.",
        isHelpful: true,
      },
      {
        authorIdx: 24, // XenonCraft
        content: "Practical addition: Do at least 30 LeetCode problems in your interview language under actual timed conditions. 45 minutes max per problem. If you can't solve it in 45 minutes, look at hints, then the solution. Don't grind blindly for hours — that's not what interviews simulate.",
        isHelpful: false,
      },
      {
        authorIdx: 15, // RocketCoder
        content: "SQL is often forgotten but some companies (especially product companies like Flipkart, Swiggy, Urban Company) have SQL rounds. Add at least 20 LeetCode SQL problems to your prep. Mode Analytics has a great SQL tutorial if you're starting from scratch.",
        isHelpful: false,
      },
    ],
  },
  {
    title: "Is the MERN stack still relevant in 2025 or should I learn something else?",
    body: "I've been learning MERN stack (MongoDB, Express, React, Node.js) for 3 months. But I keep seeing job postings asking for Next.js, TypeScript, PostgreSQL. Am I learning outdated tech? Should I pivot?",
    tags: ["MERN", "full-stack", "career"],
    isSolved: false,
    authorIdx: 16, // MindMapper
    replies: [
      {
        authorIdx: 1, // CodingHero
        content: "MERN is not dead, but the industry has evolved. Here's the honest map:\n\n• React: still dominant, but learning Next.js on top of React is now standard for production apps\n• Node + Express: valid backend but TypeScript is expected in most professional teams now\n• MongoDB: increasingly replaced by PostgreSQL in serious apps — relational data just fits most business problems better\n\nMy recommendation: don't throw away what you've learned. Add TypeScript to your React and Node. Then add Next.js concepts (SSR, API routes). Then learn the basics of SQL and PostgreSQL. This progression builds on your existing knowledge and gets you to where the industry is heading.",
        isHelpful: true,
      },
      {
        authorIdx: 17, // WebNinja
        content: "The conceptual skills you're building — component thinking, API design, async JavaScript, state management — are fully transferable. Technology changes but fundamentals don't. I moved from MERN to Next.js + Postgres in about 3 weeks because the underlying concepts were solid.\n\nFinish learning MERN properly first. Build something real with it. Then evolve.",
        isHelpful: true,
      },
      {
        authorIdx: 15, // RocketCoder
        content: "Practical answer: search for 'MERN developer' vs 'Next.js developer' on LinkedIn Jobs filtered to India, Bangalore, last 30 days. See which has more postings and better salaries. The market will give you better signal than any opinion.",
        isHelpful: false,
      },
    ],
  },
  {
    title: "How do I get into AI/ML without a strong math background?",
    body: "I'm a 3rd semester CSE student with decent Python skills but my linear algebra and calculus are weak (basically forgot everything from 12th). I want to work in AI/ML but I keep reading that you need strong math. How important is math really, and what's the path forward?",
    tags: ["AI", "machine-learning", "math"],
    isSolved: false,
    authorIdx: 16, // MindMapper
    replies: [
      {
        authorIdx: 2, // SmileyFace21
        content: "Math matters, but not the way most people think. You don't need to derive backpropagation from scratch to build useful ML systems — you need to understand *what* it's doing well enough to debug when things go wrong.\n\nHonest path for your stage:\n\n1. Start with fast.ai (fast.ai/course.html) — it teaches ML top-down (build things first, understand the math later). This is extremely effective for programmers.\n\n2. Parallel: 3Blue1Brown's 'Essence of Linear Algebra' playlist (YouTube, free, 15 videos). Watch it with a notebook. This will unlock more intuition than any textbook.\n\n3. Then: StatQuest with Josh Starmer for statistics. Again, YouTube, free, intuitive.\n\nMath baseline you *actually* need: matrix multiplication, dot products, partial derivatives, and probability basics. That's it to start building real things.",
        isHelpful: true,
      },
      {
        authorIdx: 23, // NeuroPilot
        content: "I want to give a counterpoint: if you want to go deep into AI research (publishing papers, working on frontier models), the math matters enormously. Eigenvalues, SVD, information theory, optimization theory — these are not optional at that level.\n\nBut for applied ML engineering? SmileyFace21 is right. The applied path is: Python → PyTorch basics → training loops → model evaluation → deployment. Most ML engineering roles care about whether you can ship models that work, not whether you can prove convergence theorems.",
        isHelpful: true,
      },
      {
        authorIdx: 7, // BinarySoul
        content: "Start a Kaggle account today. Pick any beginner competition (Titanic, House Prices). The process of feature engineering, model selection, and validation will teach you more practical ML in one month than any course.",
        isHelpful: false,
      },
    ],
  },
  {
    title: "What does a realistic internship preparation timeline look like for a 5th semester student?",
    body: "I'm in 5th semester. Campus internship drives happen in 7th semester (December). I want to be prepared. I've been coding casually but never done serious interview prep. Where do I start and how do I space out my preparation?",
    tags: ["internships", "placements", "planning"],
    isSolved: true,
    authorIdx: 6, // QuantumFox
    replies: [
      {
        authorIdx: 9, // StarDevGirl
        content: "You have ~18 months. That's a lot of time used well. Here's the actual timeline:\n\n**Now to 6th semester mid:** Build your base. Pick one domain (web dev, ML, systems, mobile) and build 2 solid projects you can demo. Contribute to one OSS repo. Get your resume to a solid draft.\n\n**6th semester second half:** Start DSA systematically. 2-3 problems per day. Aim for 150 quality problems by end of semester.\n\n**Semester break before 7th:** Intensive mock interviews. Pramp, Interviewing.io, peer mocks with friends. Do 2 timed practice interviews per week minimum.\n\n**7th semester (October-December):** Company research, resume refinement, actual applications. By this point, you should be solving mediums in under 30 minutes.\n\nThe biggest mistake: waiting until 6th semester to start everything. You have a head start — use it.",
        isHelpful: true,
      },
      {
        authorIdx: 13, // AlphaHacker
        content: "Add this: apply for off-campus internships starting now. Summer internships at startups often go to 4th-5th semester students. Even an unpaid internship in a good startup gives you real experience and something to talk about in campus placements. Don't wait for your campus placement to be your first real experience.",
        isHelpful: true,
      },
      {
        authorIdx: 24, // XenonCraft
        content: "Network early. LinkedIn connections with alumni from your college who are working in companies you want to join. They will share referrals. A referred application at most tech companies jumps the queue significantly. Start building these relationships when you don't need them — not when you're desperate in 7th semester.",
        isHelpful: true,
      },
    ],
  },
  {
    title: "How do I start in cybersecurity with no prior background?",
    body: "I'm a 4th semester ECE student fascinated by cybersecurity after watching a video about ethical hacking. I have basic Python skills. Where do I start, what certifications matter, and is ECE a disadvantage compared to CSE?",
    tags: ["cybersecurity", "beginners", "certifications"],
    isSolved: true,
    authorIdx: 5, // PixelPilot
    replies: [
      {
        authorIdx: 0, // CyberKnight
        content: "ECE is not a disadvantage — understanding networking at the hardware level (signal propagation, protocols) is actually useful in cybersecurity. Some of the best security engineers I know are ECE graduates.\n\nPath from zero:\n\n1. Linux fundamentals first. You cannot work in security without being comfortable in a terminal. Try 'The Linux Command Line' by William Shotts (free online).\n\n2. Networking basics: TryHackMe's 'Pre-Security' path covers TCP/IP, DNS, HTTP in a practical way. Free tier is enough.\n\n3. Then: TryHackMe 'Jr Penetration Tester' path. Takes ~60 hours. By the end you'll have real skills.\n\n4. Move to HackTheBox once you can solve Easy machines on TryHackMe.\n\nFor certifications: CompTIA Security+ is the baseline for jobs. CEH is overpriced and less respected than OSCP in technical circles. OSCP is the gold standard but it's hard and expensive — aim for it after 1 year of practice.",
        isHelpful: true,
      },
      {
        authorIdx: 13, // AlphaHacker
        content: "Participate in CTFs immediately. picoCTF is beginner-friendly and teaches core concepts through puzzles. CTFtime.org lists all ongoing competitions. Team up with other beginners — the collaborative learning is invaluable.\n\nAlso: join the HackTheBox Discord and r/netsec subreddit. The community will accelerate your learning faster than any course.",
        isHelpful: true,
      },
      {
        authorIdx: 18, // CloudSurfer
        content: "Bug bounty hunting is a great way to make money AND learn. HackerOne and Bugcrowd have beginner-friendly programs. Start with public bug bounty scopes (not private) and focus on web application vulnerabilities first — OWASP Top 10 is your syllabus.",
        isHelpful: false,
      },
    ],
  },
  {
    title: "I have a 6.2 CGPA. Should I even bother applying to product companies?",
    body: "My CGPA is 6.2 due to poor performance in first and second year. Now in 6th semester I've improved — 8.1 and 8.4 in the last two semesters. I'm good at DSA and have done 3 internships. But everyone says product companies have a 7.0 CGPA cutoff. Is there any path for me?",
    tags: ["placements", "CGPA", "career"],
    isSolved: false,
    authorIdx: 19, // LogicLion
    replies: [
      {
        authorIdx: 9, // StarDevGirl
        content: "CGPA cutoffs exist at the resume screening stage. But there are multiple ways around them:\n\n1. **Referrals**: A strong referral from an employee often bypasses the automated screening. Your internship contacts are your biggest asset here. Ask directly.\n\n2. **Off-campus applications**: Many product companies hire through channels that don't have strict CGPA cutoffs (LinkedIn 'Easy Apply', company career pages, campus drives at top colleges you can attend as an outside candidate at some fests).\n\n3. **Highlight recency**: In your resume summary, write 'Academic trend: 6.2 overall, 8.4 in the last semester'. Companies that care about growth trajectory will notice this.\n\n4. **Strong GitHub + portfolio**: This overrides CGPA for candidates who can demonstrate skills directly.\n\nYou have 3 internships. That's exceptional. Lead with that. The CGPA is a weak signal compared to actual work experience.",
        isHelpful: true,
      },
      {
        authorIdx: 3, // NinjaCoder
        content: "Competitions and certifications bypass CGPA screens entirely. A regional rank in ICPC or a Google Hash Code participation on your resume changes the conversation. Hiring managers who see competition results often fast-track candidates past the initial filter.",
        isHelpful: true,
      },
      {
        authorIdx: 13, // AlphaHacker
        content: "Start with service companies to get the first full-time offer, then lateral move to a product company after 1-1.5 years. Not ideal but it works. Companies like Thoughtworks, Publicis Sapient, and GlobalLogic do interesting product work and have more flexible CGPA cutoffs. Getting your foot in the door matters.",
        isHelpful: false,
      },
    ],
  },
  {
    title: "How do I overcome impostor syndrome as a woman in tech?",
    body: "I'm a 5th semester CSE student. I'm technically strong — top 10% in my class, completed 2 internships. But every time I'm in a technical discussion with male peers, I second-guess everything I say even when I know I'm right. I've watched job opportunities slip past me because I didn't feel 'ready'. How do other women deal with this?",
    tags: ["career", "communication", "confidence"],
    isSolved: false,
    authorIdx: 7, // BinarySoul
    replies: [
      {
        authorIdx: 9, // StarDevGirl
        content: "I'm a placed student and I've felt exactly this. Here's what helped me:\n\n1. **Document your wins**. Literally keep a folder. Every bug you fixed, every project milestone, every compliment from a senior. Read it before interviews and technical discussions. Your brain will lie to you — the folder doesn't.\n\n2. **Speak first in meetings**. The longer you wait, the harder it gets. Even one sentence early in a discussion anchors your presence. You don't have to have the full answer — 'That's an interesting constraint, let me think through it' is a valid and professional response.\n\n3. **Find your people**. AnitaB.org, Women Who Code, She++ — these communities exist because this experience is universal, not personal. The isolation is the lie.\n\nYou're not behind. You're on time.",
        isHelpful: true,
      },
      {
        authorIdx: 2, // SmileyFace21
        content: "Read 'Presence' by Amy Cuddy. She has research-backed techniques for confidence in high-stakes situations. Also: the impostor syndrome research actually shows it's more common in high-achieving women — you don't feel it because you're weak, you feel it because you care about doing good work. Reframe it.",
        isHelpful: true,
      },
      {
        authorIdx: 4, // GhostWriter
        content: "Write more publicly. A blog, a LinkedIn post, a technical thread. When you explain something to others, you internalize that you know it. Every time someone thanks you for a clear explanation, it builds evidence against the impostor voice. Start small — even 100 words explaining something you learned this week.",
        isHelpful: false,
      },
    ],
  },
  {
    title: "Full stack vs specialization — what gets you further in your career long term?",
    body: "I'm at a crossroads. I've been doing full stack web development (React + Node + Postgres) for a year and I'm decent. But I keep seeing specialists in ML, DevOps, or security making more money and having more interesting careers. Should I go deep in one area or stay broad as a full stack developer?",
    tags: ["career", "full-stack", "specialization"],
    isSolved: false,
    authorIdx: 20, // SynthWave
    replies: [
      {
        authorIdx: 1, // CodingHero
        content: "The T-shaped developer model is what you're actually describing. Broad awareness across the stack (the horizontal bar of the T) plus deep expertise in one area (the vertical). Pure generalists plateau around senior engineer. Pure specialists can go very deep but often miss system-level context.\n\nFor early career: full stack is better because you see how systems connect and you're more hireable for startups where everyone does everything. After 3-4 years, naturally specializing in what you enjoy most is the right move.\n\nMy read on your situation: you haven't been doing this long enough to specialize. Stay full stack for now, keep exploring, and let your natural interests guide the specialization.",
        isHelpful: true,
      },
      {
        authorIdx: 18, // CloudSurfer
        content: "Platform/infrastructure engineering is chronically undersupplied and incredibly well-paid. If you're looking for a specialization that's high demand and less saturated than ML, DevOps/Platform Engineering is worth serious consideration. It builds directly on full stack knowledge but goes deeper into reliability, scalability, and deployment.",
        isHelpful: true,
      },
      {
        authorIdx: 24, // XenonCraft
        content: "For founding a startup (which is my eventual goal), full stack is the only path. You need to move fast and wear every hat. Specialists often struggle in early-stage startups because there's no team to hand off to. Know your end goal and let that guide your choice.",
        isHelpful: false,
      },
    ],
  },
  {
    title: "How do I write a cold email to a senior professional for career advice without being annoying?",
    body: "I've found a few alumni and senior professionals on LinkedIn who are working in roles I aspire to. I want to reach out for advice or a coffee chat but I don't know how to write a message that doesn't come across as desperate or generic. What's the right approach?",
    tags: ["communication", "networking", "career"],
    isSolved: true,
    authorIdx: 4, // GhostWriter
    replies: [
      {
        authorIdx: 9, // StarDevGirl
        content: "The template that got me 7 out of 10 responses:\n\n---\nSubject: Quick question from a [college] student interested in [their company/field]\n\nHi [Name],\n\nI'm [your name], a [year] student at [college] studying [branch]. I've been following your work on [something specific — a talk, an article, their LinkedIn post]. [One specific observation or question about their work].\n\nI'm exploring a career in [their field] and I'd genuinely value 15 minutes of your time — even a quick voice call — to hear how you navigated the early stages.\n\nNo pressure at all if you're busy. Thank you either way.\n\n[Your name]\n[LinkedIn | GitHub]\n---\n\nThree rules: (1) Be specific — reference something real about them. (2) Ask for a small time commitment. (3) Give them an easy out so they don't feel guilty saying no.",
        isHelpful: true,
      },
      {
        authorIdx: 4, // GhostWriter
        content: "One practical addition: reach out on LinkedIn with a connection request + note, NOT email if you don't have their email address. Cold emails from unknown senders often go to spam or deleted. LinkedIn messages have a much higher read rate. Connect first, then message after they accept.",
        isHelpful: true,
      },
      {
        authorIdx: 17, // WebNinja
        content: "The best outreach I ever got was someone who had clearly read my entire portfolio website and asked a specific question about a design decision I'd made. It took them 20 minutes of effort to write but it showed genuine curiosity. That's what separates someone worth a conversation from a mass-spammer.",
        isHelpful: false,
      },
      {
        authorIdx: 24, // XenonCraft
        content: "Volume matters more than you think. Send 20 good cold messages and expect 3-4 responses. 1 of those conversations will be genuinely useful. Don't put all your hope on one message. It's a numbers game with quality as a multiplier.",
        isHelpful: false,
      },
    ],
  },
];

// ─────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────
export async function autoSeed(): Promise<void> {
  // Check both new marker ("oghemz") AND legacy marker ("CyberKnight").
  // If either is present the DB was already seeded — skip unconditionally.
  // This is safe on environments seeded by any previous version of this file.
  const existingNew = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, SEED_MARKER_USERNAME))
    .limit(1);

  if (existingNew.length > 0) return; // already seeded with EWIT dataset

  const existingLegacy = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, "CyberKnight"))
    .limit(1);

  if (existingLegacy.length > 0) {
    // Legacy environment — do not overwrite. To upgrade, run the reset script:
    // pnpm --filter @workspace/scripts run reset-seed
    console.log("[auto-seed] Legacy seed detected (CyberKnight). Skipping. Run reset-seed to upgrade to the EWIT dataset.");
    return;
  }

  console.log("[auto-seed] Seeding EWIT demo data (160 students + system accounts)...");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ── 2. Insert system accounts (admin + moderator) ──
    // ON CONFLICT DO NOTHING — safe if run more than once (e.g. mid-seed crash retry)
    let adminId: number | null = null;
    for (const sys of SYSTEM_ACCOUNTS) {
      const hash = await bcrypt.hash(sys.password, 10);
      const r = await client.query<{ id: number }>(
        `INSERT INTO users
           (username, name, email, avatar_color, password_hash,
            account_status, onboarding_complete, role, coins, is_private, created_at)
         VALUES ($1,$2,$3,$4,$5,'approved',true,$6,100,false,NOW())
         ON CONFLICT (username) DO NOTHING
         RETURNING id`,
        [sys.username, sys.name, sys.email, sys.avatarColor, hash, sys.role]
      );
      if (sys.role === "admin" && r.rows[0]) adminId = r.rows[0].id;
    }

    // If admin was already present (DO NOTHING path), fetch their id
    if (!adminId) {
      const res = await client.query<{ id: number }>(
        `SELECT id FROM users WHERE username = 'ADMIN' LIMIT 1`
      );
      adminId = res.rows[0]?.id ?? null;
    }

    // ── 3. Insert all 160 hardcoded students ──
    const studentHash = await bcrypt.hash("Student123", 10);
    const userIds: number[] = [];
    for (const s of ALL_STUDENTS) {
      const r = await client.query<{ id: number }>(
        `INSERT INTO users
           (username, name, usn, email, branch, semester, avatar_color,
            password_hash, account_status, onboarding_complete, role,
            coins, is_private, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'approved',true,'user',$9,false,NOW())
         ON CONFLICT (username) DO NOTHING
         RETURNING id`,
        [
          s.username,
          s.name,
          s.usn,
          s.email,
          s.department,
          s.semester,
          s.avatarColor,
          studentHash,
          50 + Math.floor(Math.random() * 200),
        ]
      );
      // If conflict (already exists), fetch the existing id
      if (r.rows[0]) {
        userIds.push(r.rows[0].id);
      } else {
        const existing = await client.query<{ id: number }>(
          `SELECT id FROM users WHERE username = $1 LIMIT 1`,
          [s.username]
        );
        if (existing.rows[0]) userIds.push(existing.rows[0].id);
      }
    }

    // ── 4. Insert communities ──
    const communityIds: number[] = [];
    for (let i = 0; i < COMMUNITIES.length; i++) {
      const c = COMMUNITIES[i];
      const leaderId = userIds[i % userIds.length];
      const r = await client.query<{ id: number }>(
        `INSERT INTO communities (slug, name, description, accent_color, icon, tags, leader_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW() - ($8 || ' days')::interval)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [c.slug, c.name, c.description, c.accentColor, c.icon, c.tags, leaderId, 30 + i * 10]
      );
      communityIds.push(r.rows[0].id);
    }

    // ── 5. Create memberships ──
    // Each named user joins 12-18 communities
    for (let ui = 0; ui < userIds.length; ui++) {
      const uid = userIds[ui];
      const joinCount = 12 + (ui % 7);
      const shuffled = [...communityIds].sort(() => Math.random() - 0.5).slice(0, joinCount);
      for (const cid of shuffled) {
        const daysAgo = Math.floor(Math.random() * 60);
        await client.query(
          `INSERT INTO community_members (user_id, community_id, joined_at)
           VALUES ($1,$2,NOW() - ($3 || ' days')::interval)
           ON CONFLICT DO NOTHING`,
          [uid, cid, daysAgo]
        );
      }
    }

    // ── 6. Create posts per community ──
    for (let ci = 0; ci < COMMUNITIES.length; ci++) {
      const c = COMMUNITIES[ci];
      const cid = communityIds[ci];
      const posts = COMMUNITY_POSTS[c.slug] ?? [];
      for (let pi = 0; pi < posts.length; pi++) {
        const authorId = userIds[(ci * 3 + pi) % userIds.length];
        const daysAgo = Math.floor(Math.random() * 45) + 1;
        await client.query(
          `INSERT INTO posts (author_id, community_id, body, kind, created_at)
           VALUES ($1,$2,$3,'post',NOW() - ($4 || ' days')::interval)`,
          [authorId, cid, posts[pi], daysAgo]
        );
      }
    }

    // ── 7. Create announcements ──
    if (adminId) {
      for (const ann of ANNOUNCEMENTS) {
        const authorId = ann.isAdmin ? adminId : userIds[0];
        const daysAgo = Math.floor(Math.random() * 20) + 1;
        await client.query(
          `INSERT INTO announcements (author_id, title, body, images, created_at)
           VALUES ($1,$2,$3,'{}',NOW() - ($4 || ' days')::interval)`,
          [authorId, ann.title, ann.body, daysAgo]
        );
      }
    } else {
      // Even without admin, use first demo user
      for (const ann of ANNOUNCEMENTS) {
        const authorId = userIds[0];
        const daysAgo = Math.floor(Math.random() * 20) + 1;
        await client.query(
          `INSERT INTO announcements (author_id, title, body, images, created_at)
           VALUES ($1,$2,$3,'{}',NOW() - ($4 || ' days')::interval)`,
          [authorId, ann.title, ann.body, daysAgo]
        );
      }
    }

    // ── 8. Create mentorship questions + replies ──
    for (const qa of MENTORSHIP_QA) {
      const authorId = userIds[qa.authorIdx];
      const daysAgo = Math.floor(Math.random() * 30) + 5;
      const qRes = await client.query<{ id: number }>(
        `INSERT INTO mentorship_questions (author_id, title, body, tags, is_solved, created_at)
         VALUES ($1,$2,$3,$4,$5,NOW() - ($6 || ' days')::interval)
         RETURNING id`,
        [authorId, qa.title, qa.body, qa.tags, qa.isSolved, daysAgo]
      );
      const qId = qRes.rows[0].id;

      for (let ri = 0; ri < qa.replies.length; ri++) {
        const reply = qa.replies[ri];
        const replyAuthorId = userIds[reply.authorIdx];
        const replyDaysAgo = Math.max(0, daysAgo - (ri + 1) * 2 - Math.floor(Math.random() * 3));
        await client.query(
          `INSERT INTO mentorship_replies (question_id, author_id, content, is_helpful, helpful_count, created_at)
           VALUES ($1,$2,$3,$4,$5,NOW() - ($6 || ' days')::interval)`,
          [qId, replyAuthorId, reply.content, reply.isHelpful, reply.isHelpful ? Math.floor(Math.random() * 15) + 3 : Math.floor(Math.random() * 5), replyDaysAgo]
        );
      }
    }

    // ── 9. Marketplace listings + reviews ──
    for (const listing of MARKETPLACE_LISTINGS) {
      const sellerId = userIds[listing.sellerIdx];
      const prodRes = await client.query<{ id: number }>(
        `INSERT INTO marketplace_products (seller_id, title, description, price, category, images, created_at)
         VALUES ($1,$2,$3,$4,$5,'{}',NOW() - (${Math.floor(Math.random() * 60) + 5} || ' days')::interval)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [sellerId, listing.title, listing.description, listing.price, listing.category]
      );
      if (!prodRes.rows[0]) continue; // skip if already seeded
      const productId = prodRes.rows[0].id;

      // Full reviews (with comment)
      for (const rev of listing.reviews) {
        const reviewerId = userIds[rev.reviewerIdx];
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        await client.query(
          `INSERT INTO product_reviews (product_id, reviewer_id, rating, comment, created_at)
           VALUES ($1,$2,$3,$4,NOW() - ($5 || ' days')::interval)
           ON CONFLICT DO NOTHING`,
          [productId, reviewerId, rev.rating, rev.comment, daysAgo]
        );
      }

      // Extra rating-only entries (no comment) to reach 20-25 total
      for (const rIdx of listing.extraRaterIdxs) {
        const reviewerId = userIds[rIdx];
        const rating = 3 + Math.floor(Math.random() * 3); // 3-5
        const daysAgo = Math.floor(Math.random() * 45) + 1;
        await client.query(
          `INSERT INTO product_reviews (product_id, reviewer_id, rating, comment, created_at)
           VALUES ($1,$2,$3,NULL,NOW() - ($4 || ' days')::interval)
           ON CONFLICT DO NOTHING`,
          [productId, reviewerId, rating, daysAgo]
        );
      }
    }

    // ── 10. Freelance services + reviews ──
    for (const service of FREELANCE_LISTINGS) {
      const providerId = userIds[service.providerIdx];
      const svcRes = await client.query<{ id: number }>(
        `INSERT INTO freelance_services (provider_id, title, description, price, category, images, delivery_days, created_at)
         VALUES ($1,$2,$3,$4,$5,'{}', $6, NOW() - (${Math.floor(Math.random() * 60) + 5} || ' days')::interval)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [providerId, service.title, service.description, service.price, service.category, service.deliveryDays]
      );
      if (!svcRes.rows[0]) continue;
      const serviceId = svcRes.rows[0].id;

      // Full reviews (with comment)
      for (const rev of service.reviews) {
        const reviewerId = userIds[rev.reviewerIdx];
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        await client.query(
          `INSERT INTO service_reviews (service_id, reviewer_id, rating, comment, created_at)
           VALUES ($1,$2,$3,$4,NOW() - ($5 || ' days')::interval)
           ON CONFLICT DO NOTHING`,
          [serviceId, reviewerId, rev.rating, rev.comment, daysAgo]
        );
      }

      // Extra rating-only entries
      for (const rIdx of service.extraRaterIdxs) {
        const reviewerId = userIds[rIdx];
        const rating = 3 + Math.floor(Math.random() * 3); // 3-5
        const daysAgo = Math.floor(Math.random() * 45) + 1;
        await client.query(
          `INSERT INTO service_reviews (service_id, reviewer_id, rating, comment, created_at)
           VALUES ($1,$2,$3,NULL,NOW() - ($4 || ' days')::interval)
           ON CONFLICT DO NOTHING`,
          [serviceId, reviewerId, rating, daysAgo]
        );
      }
    }

    // ── 11. Admin categories (marketplace + freelance) ──
    const MARKETPLACE_CATEGORIES = [
      "Handmade", "Fashion", "Stationery", "Digital", "Accessories",
      "Beauty", "Food", "Gifts", "Art", "Electronics", "Books & Notes", "Sports",
    ];
    const FREELANCE_CATEGORIES = [
      "AI & Automation", "Web Development", "Design", "Marketing", "Writing",
      "Video & Media", "Data & Analytics", "Cybersecurity", "Operations",
      "Photography", "Music & Audio", "Event Management", "Tutoring & Education",
    ];
    for (const name of MARKETPLACE_CATEGORIES) {
      await client.query(`INSERT INTO categories (type, name) VALUES ('marketplace', $1)`, [name]);
    }
    for (const name of FREELANCE_CATEGORIES) {
      await client.query(`INSERT INTO categories (type, name) VALUES ('freelance', $1)`, [name]);
    }

    // ── 12. Skills / interests ──
    const INTERESTS_SEED = [
      { name: "Programming",        category: "Technology", emoji: "💻" },
      { name: "Web Development",    category: "Technology", emoji: "🌐" },
      { name: "Machine Learning",   category: "Technology", emoji: "🤖" },
      { name: "Cybersecurity",      category: "Technology", emoji: "🔐" },
      { name: "IoT",                category: "Technology", emoji: "📡" },
      { name: "Data Science",       category: "Technology", emoji: "📊" },
      { name: "Mobile Apps",        category: "Technology", emoji: "📱" },
      { name: "Cloud Computing",    category: "Technology", emoji: "☁️" },
      { name: "DevOps",             category: "Technology", emoji: "⚙️" },
      { name: "Open Source",        category: "Technology", emoji: "🧑‍💻" },
      { name: "UI/UX Design",       category: "Design",     emoji: "🎨" },
      { name: "Graphic Design",     category: "Design",     emoji: "✏️" },
      { name: "3D Modeling",        category: "Design",     emoji: "🧊" },
      { name: "Photography",        category: "Design",     emoji: "📷" },
      { name: "Video Editing",      category: "Design",     emoji: "🎬" },
      { name: "Motion Graphics",    category: "Design",     emoji: "🎞️" },
      { name: "Illustration",       category: "Design",     emoji: "🖌️" },
      { name: "Brand Design",       category: "Design",     emoji: "🏷️" },
      { name: "Entrepreneurship",   category: "Business",   emoji: "🚀" },
      { name: "Digital Marketing",  category: "Business",   emoji: "📣" },
      { name: "Finance",            category: "Business",   emoji: "💰" },
      { name: "Product Management", category: "Business",   emoji: "📋" },
      { name: "Business Analytics", category: "Business",   emoji: "📈" },
      { name: "Social Media",       category: "Business",   emoji: "📲" },
      { name: "Consulting",         category: "Business",   emoji: "🤝" },
      { name: "Research",           category: "Science",    emoji: "🔬" },
      { name: "Mathematics",        category: "Science",    emoji: "📐" },
      { name: "Physics",            category: "Science",    emoji: "⚛️" },
      { name: "Biotechnology",      category: "Science",    emoji: "🧬" },
      { name: "Environmental Sc.", category: "Science",    emoji: "🌿" },
      { name: "Music",              category: "Arts",       emoji: "🎵" },
      { name: "Dance",              category: "Arts",       emoji: "💃" },
      { name: "Painting",           category: "Arts",       emoji: "🖼️" },
      { name: "Creative Writing",   category: "Arts",       emoji: "📝" },
      { name: "Theatre",            category: "Arts",       emoji: "🎭" },
      { name: "Film",               category: "Arts",       emoji: "🎥" },
      { name: "Badminton",          category: "Sports",     emoji: "🏸" },
      { name: "Cricket",            category: "Sports",     emoji: "🏏" },
      { name: "Football",           category: "Sports",     emoji: "⚽" },
      { name: "Basketball",         category: "Sports",     emoji: "🏀" },
      { name: "Chess",              category: "Sports",     emoji: "♟️" },
      { name: "Swimming",           category: "Sports",     emoji: "🏊" },
      { name: "Table Tennis",       category: "Sports",     emoji: "🏓" },
      { name: "Athletics",          category: "Sports",     emoji: "🏃" },
      { name: "Event Planning",     category: "Social",     emoji: "🗓️" },
      { name: "Volunteering",       category: "Social",     emoji: "🙌" },
      { name: "Public Speaking",    category: "Social",     emoji: "🎤" },
      { name: "Debate",             category: "Social",     emoji: "💬" },
      { name: "Leadership",         category: "Social",     emoji: "🌟" },
      { name: "Community Building", category: "Social",     emoji: "🏘️" },
    ];
    for (const interest of INTERESTS_SEED) {
      await client.query(
        `INSERT INTO interests (name, category, emoji) VALUES ($1,$2,$3) ON CONFLICT (name) DO NOTHING`,
        [interest.name, interest.category, interest.emoji]
      );
    }

    // ── 13. oghemz: mentorship question ──
    // oghemz is ALL_STUDENTS[79] — IoT, index 79
    const oghemzId = userIds[79];
    await client.query(
      `INSERT INTO mentorship_questions (author_id, title, body, tags, is_solved, created_at)
       VALUES ($1,$2,$3,$4,false,NOW() - INTERVAL '3 hours')`,
      [
        oghemzId,
        "How do I design an ER diagram for a library management system?",
        "I'm working on my DBMS assignment and got stuck on the entity-relationship diagram for a library management system. The system needs to track books, members, loans, and reservations. Should Book and Copy of Book be separate entities? And how do I handle the many-to-many relationship between Members and Books through loans? Any guidance on normalization (3NF) would really help.",
        ["DBMS", "ER Diagram", "Normalization", "SQL"],
      ]
    );

    // ── 14. oghemz: hackathon invite — Sapthagiri NPS University ──
    await client.query(
      `INSERT INTO posts (
         author_id, body, kind,
         hackathon_date, hackathon_location, hackathon_team_size,
         hackathon_skills, hackathon_filled, hackathon_college_name,
         hackathon_registration_fee, hackathon_problem_statement,
         hackathon_registration_link, images, created_at
       ) VALUES ($1,$2,'hackathon','2025-08-15',$3,4,$4,false,'Sapthagiri NPS University',
                 'Free',$5,$6,'{}',NOW() - INTERVAL '1 hour')`,
      [
        oghemzId,
        "🚀 Excited to share — Sapthagiri NPS University is hosting InnovateSphere 2025, an inter-college AI & Innovation Hackathon! Great opportunity to build something meaningful, connect with talented students across Bangalore, and win some cool prizes. Our team still has one open slot — DM me if you're interested! #Hackathon #AI #InnovateSphere2025",
        "Sapthagiri NPS University, Bangalore",
        ["Artificial Intelligence", "Machine Learning", "Python", "React", "Data Science"],
        "Build an AI-powered solution to address a real-world campus or community challenge. Judged on innovation, technical depth, and presentation.",
        "https://sapthagiriuniversity.edu.in/innovatesphere2025",
      ]
    );

    // ── 15. DM conversations: oghemz ↔ arjunsh & oghemz ↔ sruthik ──
    // arjunsh = ALL_STUDENTS[0], sruthik = ALL_STUDENTS[27]
    const arjunshId = userIds[0];
    const sruthikId = userIds[27];

    // Accepted follow relationships (bidirectional)
    for (const [a, b] of [[oghemzId, arjunshId], [arjunshId, oghemzId], [oghemzId, sruthikId], [sruthikId, oghemzId]]) {
      await client.query(
        `INSERT INTO follows (follower_id, followee_id, status) VALUES ($1,$2,'accepted') ON CONFLICT DO NOTHING`,
        [a, b]
      );
    }

    // oghemz ↔ arjunsh — DBMS assignment + hackathon planning (yesterday afternoon)
    // Offsets in minutes from NOW(): 1 day 4h 30m → 1 day 3h 33m
    const arjunMsgs: [number, number, string, number][] = [
      [oghemzId,  arjunshId, "Bro, did you submit the DBMS assignment?",                                               1710],
      [arjunshId, oghemzId,  "Not yet 😭. I just started yesterday.",                                                 1707],
      [oghemzId,  arjunshId, "Classic. Deadline is tomorrow at 11:59 PM.",                                            1705],
      [arjunshId, oghemzId,  "I know... I'm hoping the professor extends it.",                                         1703],
      [oghemzId,  arjunshId, "Don't depend on miracles. Finish it today.",                                             1700],
      [arjunshId, oghemzId,  "Fair 😂. By the way, are you joining the AI hackathon next month?",                     1698],
      [oghemzId,  arjunshId, "Definitely. Already looking for teammates.",                                             1696],
      [arjunshId, oghemzId,  "Need one more member?",                                                                  1694],
      [oghemzId,  arjunshId, "Yeah, if you're serious. We need someone who can handle frontend or presentations.",     1692],
      [arjunshId, oghemzId,  "I can do React and a bit of UI.",                                                        1690],
      [oghemzId,  arjunshId, "Perfect. That actually helps a lot.",                                                    1688],
      [arjunshId, oghemzId,  "What's the project idea?",                                                               1686],
      [oghemzId,  arjunshId, "Thinking about an AI-powered campus assistant for students.",                            1684],
      [arjunshId, oghemzId,  "That's actually a solid idea. We could even add timetable reminders.",                  1682],
      [oghemzId,  arjunshId, "Exactly, and maybe lost & found plus event recommendations.",                            1679],
      [arjunshId, oghemzId,  "Nice. Are you free this weekend to discuss it?",                                         1677],
      [oghemzId,  arjunshId, "Saturday afternoon works.",                                                              1675],
      [arjunshId, oghemzId,  "Cool. Library or cafeteria?",                                                            1673],
      [oghemzId,  arjunshId, "Cafeteria first. Better coffee, then library if we actually start coding 😂",            1671],
      [arjunshId, oghemzId,  "Deal 😂",                                                                               1669],
      [oghemzId,  arjunshId, "Also, have you started learning Git properly?",                                          1667],
      [arjunshId, oghemzId,  "Barely. I know commits and push, that's about it.",                                     1665],
      [oghemzId,  arjunshId, "That's enough to start. I'll show you branches and pull requests.",                     1663],
      [arjunshId, oghemzId,  "Appreciate it, bro.",                                                                    1661],
      [oghemzId,  arjunshId, "No worries. Just don't upload node_modules to GitHub 😭",                               1659],
      [arjunshId, oghemzId,  "Too late... I did that once 💀",                                                        1657],
      [oghemzId,  arjunshId, "😂 Every developer has committed that crime at least once.",                             1655],
      [arjunshId, oghemzId,  "Good to know I'm officially part of the club now.",                                      1653],
    ];
    for (const [sid, rid, body, minsAgo] of arjunMsgs) {
      await client.query(
        `INSERT INTO messages (sender_id, recipient_id, body, kind, read, created_at)
         VALUES ($1,$2,$3,'text',true,NOW() - ($4 || ' minutes')::interval)`,
        [sid, rid, body, minsAgo]
      );
    }

    // oghemz ↔ sruthik — badminton challenge (today morning)
    // Offsets in minutes from NOW(): 6h 30m → 5h 41m
    const sruthikMsgs: [number, number, string, number][] = [
      [oghemzId,  sruthikId, "Hey, badminton today after classes?",                                            390],
      [sruthikId, oghemzId,  "I'm in! What time?",                                                             387],
      [oghemzId,  sruthikId, "Around 5:30 PM near the indoor court.",                                          385],
      [sruthikId, oghemzId,  "Perfect. Don't go easy on me this time 😤",                                      383],
      [oghemzId,  sruthikId, "Bro, I never go easy. You just need better footwork 😂",                        381],
      [sruthikId, oghemzId,  "Excuses. Last time you won because my racket strings were loose.",               379],
      [oghemzId,  sruthikId, "Sure... blame the racket instead of your backhand.",                             377],
      [sruthikId, oghemzId,  "Okay, Mr. Smash King. Singles or doubles?",                                      375],
      [oghemzId,  sruthikId, "Let's start with singles, then we'll join the others for doubles.",              373],
      [sruthikId, oghemzId,  "Deal. Loser buys a juice?",                                                       371],
      [oghemzId,  sruthikId, "Done. Mango juice for me already 😎",                                            369],
      [sruthikId, oghemzId,  "Confidence is dangerous.",                                                        367],
      [oghemzId,  sruthikId, "Confidence comes from practice 😏",                                              365],
      [sruthikId, oghemzId,  "I've been practicing too, don't underestimate me.",                              363],
      [oghemzId,  sruthikId, "Good. I want a proper match, not a five-minute warm-up.",                        361],
      [sruthikId, oghemzId,  "First to 21?",                                                                    359],
      [oghemzId,  sruthikId, "Yep. Official rules. No cheating on line calls 😂",                              357],
      [sruthikId, oghemzId,  "Fine. But if I win, you're posting \"Sruthi is the campus badminton champion\" on the community.", 355],
      [oghemzId,  sruthikId, "😂 Not happening. If you win, I'll post \"GG, well played.\"",                   353],
      [sruthikId, oghemzId,  "Accepted. See you at 5:30.",                                                      351],
      [oghemzId,  sruthikId, "Bring your A-game.",                                                              349],
      [sruthikId, oghemzId,  "And don't be late like last week.",                                               347],
      [oghemzId,  sruthikId, "That was one time 😭",                                                            345],
      [sruthikId, oghemzId,  "See you, bro.",                                                                   343],
      [oghemzId,  sruthikId, "See you. May the best player win! 🏸",                                           341],
    ];
    for (const [sid, rid, body, minsAgo] of sruthikMsgs) {
      await client.query(
        `INSERT INTO messages (sender_id, recipient_id, body, kind, read, created_at)
         VALUES ($1,$2,$3,'text',true,NOW() - ($4 || ' minutes')::interval)`,
        [sid, rid, body, minsAgo]
      );
    }

    await client.query("COMMIT");
    console.log(`[auto-seed] ✅ Done — ${ALL_STUDENTS.length} students, ${SYSTEM_ACCOUNTS.length} system accounts, ${COMMUNITIES.length} communities, ${MENTORSHIP_QA.length} mentorship threads, ${MARKETPLACE_LISTINGS.length} marketplace listings, ${FREELANCE_LISTINGS.length} freelance services, 25 categories, 50 skills, 2 DM threads`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[auto-seed] ❌ Failed:", err);
  } finally {
    client.release();
  }
}
