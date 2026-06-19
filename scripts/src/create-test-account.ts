import pg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const UNSPLASH = (query: string, w = 600, h = 500) =>
  `https://source.unsplash.com/featured/${w}x${h}/?${encodeURIComponent(query)}`;

const products = [
  {
    title: "MacBook Pro 14\" M2 — Excellent Condition",
    description: "Used for 6 months during my internship. Comes with original charger and box. No scratches, no dents. Battery health 98%. Perfect for dev work or design.",
    price: 89000,
    category: "Electronics",
    condition: "Like New",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600",
    ],
    contact: "DM me on Unify or WhatsApp: 9876543200",
  },
  {
    title: "Sony WH-1000XM4 Noise Cancelling Headphones",
    description: "Barely used, bought 3 months ago. ANC works perfectly. Comes with case, USB-C cable, and audio jack adapter. Great for studying in the library.",
    price: 12500,
    category: "Electronics",
    condition: "Like New",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600",
    ],
    contact: "Message me on Unify",
  },
  {
    title: "Engineering Drawing Instruments Set",
    description: "Full set — drafting compass, set squares (30/60 and 45), protractor, scale ruler, French curves. Used for 2 semesters. All pieces intact.",
    price: 350,
    category: "Books & Stationery",
    condition: "Good",
    images: [
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600",
    ],
    contact: "Meet on campus, Block A canteen",
  },
  {
    title: "Mechanical Keyboard — Keychron K2 (Brown Switches)",
    description: "Hot-swap board with brown tactile switches. Wireless BT 5.1 + USB-C. RGB backlight. Compact 75% layout. Great for coding. Selling because upgrading to custom board.",
    price: 5800,
    category: "Electronics",
    condition: "Good",
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
      "https://images.unsplash.com/photo-1595044426077-d36d9236d54a?w=600",
    ],
    contact: "DM on Unify",
  },
  {
    title: "Data Structures & Algorithms by Narasimha Karumanchi",
    description: "The DSA bible for placements! Comprehensive coverage of arrays, trees, graphs, DP. My copy has some pencil markings but all content is readable. Used for TCS & Infosys prep.",
    price: 280,
    category: "Books & Stationery",
    condition: "Good",
    images: [
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600",
    ],
    contact: "Library entrance, anytime after 2PM",
  },
  {
    title: "Arduino Mega 2560 + Starter Kit",
    description: "Complete starter kit — Arduino Mega, breadboard, 50+ components (LEDs, resistors, sensors, servo, LCD). Perfect for IoT projects and lab assignments. All tested and working.",
    price: 1200,
    category: "Electronics",
    condition: "Good",
    images: [
      "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600",
    ],
    contact: "Lab 204, Thursday after 4PM",
  },
  {
    title: "Comfortable Study Chair — Adjustable Height",
    description: "Ergonomic study chair with lumbar support and adjustable height. Used for 1 year, very comfortable for long study sessions. No tears or damage. Pickup from Hostel Block C.",
    price: 1800,
    category: "Furniture",
    condition: "Good",
    images: [
      "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600",
    ],
    contact: "Hostel Block C, Room 214",
  },
  {
    title: "iPad 10th Gen 64GB WiFi + Apple Pencil",
    description: "iPad 10th gen in Blue, 64GB WiFi. Comes with Apple Pencil (2nd gen). Battery health 95%. Selling because I switched to a drawing tablet. Great for notes, Notability, Procreate.",
    price: 38000,
    category: "Electronics",
    condition: "Like New",
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600",
      "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600",
    ],
    contact: "DM for photos. Meet on campus only.",
  },
  {
    title: "Calculus & Linear Algebra Textbooks (VTU)",
    description: "VTU-prescribed Calculus (B.S. Grewal) and Linear Algebra (Kreyszig). Both in good condition. Useful for 1st and 2nd semester maths. Selling together as a bundle.",
    price: 400,
    category: "Books & Stationery",
    condition: "Fair",
    images: [
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600",
    ],
    contact: "Find me in Reading Room daily 5-7PM",
  },
  {
    title: "Portable Monitor — 15.6\" Full HD USB-C",
    description: "Arzopa portable monitor, 1080p, 60Hz. Plug and play via USB-C. Works with laptop, phone, Switch. Slim and lightweight. Comes with case and both USB-C and HDMI cables.",
    price: 7500,
    category: "Electronics",
    condition: "Like New",
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600",
    ],
    contact: "DM on Unify to arrange meet",
  },
];

const reviewTexts = [
  { rating: 5, comment: "Exactly as described! Smooth transaction, met on campus. Highly recommended seller 👍" },
  { rating: 4, comment: "Good condition, a small mark I hadn't noticed from the photos but price was fair. Quick response." },
  { rating: 5, comment: "Super quick delivery and item was exactly as described. Would buy from this seller again!" },
  { rating: 3, comment: "Item was okay but took 2 days to respond. Condition was a bit worse than photos. Price was reasonable." },
  { rating: 5, comment: "Amazing deal! The headphones work perfectly. Seller was very responsive and friendly." },
  { rating: 4, comment: "Good product, met at the canteen as arranged. Everything working fine so far." },
  { rating: 5, comment: "Best seller on campus! Fast, honest, and items are always as described. 10/10" },
];

async function run() {
  const client = await pool.connect();
  try {
    // Remove existing test account
    await client.query(`DELETE FROM users WHERE username = 'test' OR usn = 'TEST'`);

    // Create test user
    const ph = await bcrypt.hash("test123", 10);
    const userRes = await client.query(
      `INSERT INTO users(
        username, name, usn, email, mobile_number, dob,
        role, password_hash, coins, account_status,
        onboarding_complete, is_private,
        avatar_color, banner_color,
        bio, skills, semester, branch, year_enrolled,
        created_at, updated_at
      ) VALUES(
        'test','Test User','TEST','test@ewit.edu','9000000001','2005-01-01',
        'user',$1,250,'approved',
        true,false,
        '#7c5cff','#1a1040',
        'Test account for demo purposes. All marketplace listings owned by this account can be edited.',
        ARRAY['Testing','React','Node.js'],
        '4','CS','2022',
        NOW(), NOW()
      ) RETURNING id`,
      [ph]
    );
    const testUserId: number = userRes.rows[0].id;
    console.log(`✅ Test user created: id=${testUserId}, username=test, password=test123`);

    // Get some real user IDs for reviews
    const reviewers = await client.query(
      `SELECT id FROM users WHERE role='user' AND account_status='approved' AND id != $1 ORDER BY id LIMIT 10`,
      [testUserId]
    );
    const reviewerIds: number[] = reviewers.rows.map((r: { id: number }) => r.id);

    // Remove any existing products by test account (none, since user was just created)
    // Create marketplace products
    const productIds: number[] = [];
    for (const p of products) {
      const r = await client.query(
        `INSERT INTO marketplace_products(
          seller_id, title, description, price, category,
          images, contact_info,
          created_at, updated_at
        ) VALUES($1,$2,$3,$4,$5,$6,$7,
          NOW() - INTERVAL '${Math.floor(Math.random() * 30) + 1} days',
          NOW()
        ) RETURNING id`,
        [testUserId, p.title, p.description, p.price, p.category,
         p.images, p.contact]
      );
      productIds.push(r.rows[0].id);
    }
    console.log(`✅ Created ${productIds.length} marketplace listings owned by test account`);

    // Add reviews to some products (from other users)
    let reviewCount = 0;
    for (let i = 0; i < Math.min(productIds.length - 2, reviewerIds.length); i++) {
      const pid = productIds[i];
      const rid = reviewerIds[i];
      if (!rid) continue;
      const rev = reviewTexts[i % reviewTexts.length];
      await client.query(
        `INSERT INTO product_reviews(product_id, reviewer_id, rating, comment, created_at)
         VALUES($1,$2,$3,$4, NOW() - INTERVAL '${Math.floor(Math.random() * 14) + 1} days')
         ON CONFLICT DO NOTHING`,
        [pid, rid, rev.rating, rev.comment]
      );
      reviewCount++;
    }
    console.log(`✅ Added ${reviewCount} reviews on test account's listings`);

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TEST ACCOUNT READY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Login field : test
  Password    : test123
  Username    : @test
  Role        : user (approved)
  Marketplace : ${productIds.length} listings (all editable)
  Reviews     : ${reviewCount} received
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error("❌", err.message);
  process.exit(1);
});
