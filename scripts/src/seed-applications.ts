import pg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const AVATAR_COLORS = ["#7c5cff","#e85d75","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#f97316","#06b6d4","#84cc16","#ef4444"];
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

const applicants = [
  { name:"Rohit Shenoy",    usn:"1EW25IC021", branch:"CI", sem:"2", email:"rohit.shenoy@ewit.edu",    mobile:"9876543210", dob:"2007-04-12", pw:"rohit@123" },
  { name:"Tejaswini B",     usn:"1EW25IC022", branch:"CI", sem:"2", email:"tejaswini.b@ewit.edu",     mobile:"9845612378", dob:"2007-07-23", pw:"teja@123"  },
  { name:"Manoj Hegde",     usn:"1EW25IC023", branch:"CI", sem:"2", email:"manoj.hegde@ewit.edu",     mobile:"9912345678", dob:"2007-01-08", pw:"manoj@123" },
  { name:"Pooja Kulkarni",  usn:"1EW25IC024", branch:"CI", sem:"2", email:"pooja.kulk@ewit.edu",      mobile:"9823456789", dob:"2007-09-15", pw:"pooja@123" },
  { name:"Suraj Patil",     usn:"1EW25IC025", branch:"CI", sem:"2", email:"suraj.patil@ewit.edu",     mobile:"9745678901", dob:"2007-03-30", pw:"suraj@123" },
  { name:"Akshata Naik",    usn:"1EW25IC026", branch:"CI", sem:"2", email:"akshata.naik@ewit.edu",    mobile:"9634567890", dob:"2007-11-02", pw:"akshata@123" },
  { name:"Yashwanth Gowda", usn:"1EW25IC027", branch:"CI", sem:"2", email:"yash.gowda@ewit.edu",     mobile:"9523456789", dob:"2007-05-18", pw:"yash@123"  },
  { name:"Shruthi K",       usn:"1EW25IC028", branch:"CI", sem:"2", email:"shruthi.k@ewit.edu",       mobile:"9412345678", dob:"2007-08-25", pw:"shruthi@123" },
  { name:"Nikhil Shetty",   usn:"1EW25IC029", branch:"CI", sem:"2", email:"nikhil.shetty@ewit.edu",  mobile:"9301234567", dob:"2007-02-14", pw:"nikhil@123" },
  { name:"Bhavana R",       usn:"1EW25IC030", branch:"CI", sem:"2", email:"bhavana.r@ewit.edu",       mobile:"9190123456", dob:"2007-06-07", pw:"bhavana@123" },
  { name:"Ganesh Murthy",   usn:"1EW25IC031", branch:"CI", sem:"2", email:"ganesh.murthy@ewit.edu",   mobile:"9089012345", dob:"2007-10-21", pw:"ganesh@123" },
  { name:"Ranjitha M",      usn:"1EW25IC032", branch:"CI", sem:"2", email:"ranjitha.m@ewit.edu",      mobile:"8978901234", dob:"2007-12-03", pw:"ranjitha@123" },
  { name:"Pavan Kumar",     usn:"1EW25IC033", branch:"CI", sem:"2", email:"pavan.kumar@ewit.edu",     mobile:"8867890123", dob:"2007-04-28", pw:"pavan@123" },
  { name:"Chaitra S",       usn:"1EW25IC034", branch:"CI", sem:"2", email:"chaitra.s@ewit.edu",       mobile:"8756789012", dob:"2007-07-09", pw:"chaitra@123" },
  { name:"Harish T",        usn:"1EW25IC035", branch:"CI", sem:"2", email:"harish.t@ewit.edu",        mobile:"8645678901", dob:"2007-01-17", pw:"harish@123" },
  { name:"Madhuri Rao",     usn:"1EW25IC036", branch:"CS", sem:"2", email:"madhuri.rao@ewit.edu",     mobile:"8534567890", dob:"2007-09-04", pw:"madhuri@123" },
  { name:"Santhosh V",      usn:"1EW25IC037", branch:"CS", sem:"2", email:"santhosh.v@ewit.edu",      mobile:"8423456789", dob:"2007-03-11", pw:"santhosh@123" },
  { name:"Keerthi Prasad",  usn:"1EW25CS001", branch:"CS", sem:"2", email:"keerthi.p@ewit.edu",      mobile:"8312345678", dob:"2007-11-26", pw:"keerthi@123" },
  { name:"Deepak Nayak",    usn:"1EW25CS002", branch:"CS", sem:"2", email:"deepak.nayak@ewit.edu",    mobile:"8201234567", dob:"2007-05-05", pw:"deepak@123" },
  { name:"Varsha Bhat",     usn:"1EW25CS003", branch:"CS", sem:"2", email:"varsha.bhat@ewit.edu",     mobile:"8190123456", dob:"2007-08-13", pw:"varsha@123" },
  { name:"Naveen Raj",      usn:"1EW25CS004", branch:"CS", sem:"4", email:"naveen.raj@ewit.edu",      mobile:"8079012345", dob:"2005-02-22", pw:"naveen@123" },
  { name:"Preethi M",       usn:"1EW23IS010", branch:"IS", sem:"4", email:"preethi.m@ewit.edu",       mobile:"7968901234", dob:"2005-06-19", pw:"preethi@123" },
  { name:"Vinay Kumar S",   usn:"1EW23IS011", branch:"IS", sem:"4", email:"vinay.kumar@ewit.edu",     mobile:"7857890123", dob:"2005-10-07", pw:"vinay@123"  },
  { name:"Lalitha N",       usn:"1EW23IS012", branch:"IS", sem:"4", email:"lalitha.n@ewit.edu",       mobile:"7746789012", dob:"2005-04-16", pw:"lalitha@123" },
  { name:"Rishi Verma",     usn:"1EW23EC005", branch:"EC", sem:"4", email:"rishi.verma@ewit.edu",     mobile:"7635678901", dob:"2005-12-30", pw:"rishi@123"  },
];

// Statuses: 9 pending, 9 approved, 7 rejected (to show a mix)
const statuses = [
  "pending","pending","pending","pending","pending","pending","pending","pending","pending",
  "approved","approved","approved","approved","approved","approved","approved","approved","approved",
  "rejected","rejected","rejected","rejected","rejected","rejected","rejected",
];

async function run() {
  const client = await pool.connect();
  try {
    // Remove any existing applicant USNs to avoid conflicts
    for (const a of applicants) {
      await client.query(`DELETE FROM users WHERE usn = $1`, [a.usn]);
    }

    let inserted = 0;
    for (let i = 0; i < applicants.length; i++) {
      const a = applicants[i];
      const status = statuses[i] ?? "pending";
      const ph = await bcrypt.hash(a.pw, 10);
      const picSeed = 100 + i;

      // Use a plausible-looking document URL (picsum works as a placeholder image)
      const idCardUrl    = `https://picsum.photos/seed/idcard${picSeed}/800/500`;
      const feeReceiptUrl = `https://picsum.photos/seed/fee${picSeed}/800/500`;

      const daysAgo = randInt(1, 30);
      await client.query(`
        INSERT INTO users(
          username, name, usn, email, mobile_number, dob,
          role, password_hash, coins, account_status,
          onboarding_complete, is_private,
          avatar_color, banner_color,
          id_card_url, fee_receipt_url,
          semester, branch, year_enrolled,
          created_at, updated_at
        ) VALUES(
          $1,$2,$3,$4,$5,$6,
          'user',$7,50,$8,
          false, true,
          $9,'#0f172a',
          $10,$11,
          $12,$13,'2025',
          NOW() - INTERVAL '${daysAgo} days',
          NOW() - INTERVAL '${daysAgo} days'
        )
        ON CONFLICT (username) DO NOTHING
      `, [
        a.usn, a.name, a.usn, a.email, a.mobile, a.dob,
        ph, status,
        pick(AVATAR_COLORS),
        idCardUrl, feeReceiptUrl,
        a.sem, a.branch,
      ]);
      inserted++;
    }

    const counts = await client.query(`
      SELECT account_status, count(*) FROM users
      WHERE account_status IN ('pending','approved','rejected')
        AND username NOT IN ('ADMIN','MODERATOR')
      GROUP BY account_status
    `);
    console.log("✅ Applications seeded:", inserted, "records");
    console.log("Status breakdown:", counts.rows.map(r => `${r.account_status}=${r.count}`).join(", "));
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
