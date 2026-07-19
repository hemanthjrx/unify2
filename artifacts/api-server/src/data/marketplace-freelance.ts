/**
 * marketplace-freelance.ts
 * Hardcoded demo data for Marketplace (20 listings) and Freelancing (10 services).
 * All sellers, providers, and reviewers are taken from ALL_STUDENTS by index.
 *
 * Student index map (matches ALL_STUDENTS order in auto-seed):
 *   AIML  0-19  | CSE  20-39 | ISE   40-59 | IOT  60-79
 *   ECE  80-99  | EEE 100-119| ME   120-139 | Civil 140-159
 *
 * Rules enforced:
 * - No student reviews their own listing / service.
 * - Reviewers spread across departments.
 * - Title + description exactly as specified.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DemoReview {
  reviewerIdx: number; // index into ALL_STUDENTS
  rating: number;      // 1–5
  comment: string;
}

export interface MarketplaceListing {
  sellerIdx: number;
  title: string;
  description: string;
  price: string;
  category: string;
  /** Indices of students who leave a rating-only entry (no comment) to pad to 20-25 total */
  extraRaterIdxs: number[];
  reviews: DemoReview[]; // 6–9 with full comments
}

export interface FreelanceListing {
  providerIdx: number;
  title: string;
  description: string;
  price: string;
  category: string;
  deliveryDays: number;
  extraRaterIdxs: number[];
  reviews: DemoReview[];
}

// ─── Marketplace Listings ─────────────────────────────────────────────────────

export const MARKETPLACE_LISTINGS: MarketplaceListing[] = [
  // 1. Scented Soy Candles — seller: Kavya Reddy (AIML, idx 7)
  {
    sellerIdx: 7,
    title: "Scented Soy Candles",
    description:
      "Hand-poured in small batches, these eco-friendly soy candles come in unique scent blends to help you relax after a long day of lectures.",
    price: "249.00",
    category: "handmade",
    extraRaterIdxs: [0, 2, 5, 20, 22, 40, 42, 60, 62, 80, 82, 100, 102, 120],
    reviews: [
      { reviewerIdx: 1,  rating: 5, comment: "Absolutely love the lavender blend! Burns evenly and the scent lasts for hours. My room smells amazing now." },
      { reviewerIdx: 11, rating: 5, comment: "The packaging is so cute and the candle itself is wonderful. Perfect gift for my roommate." },
      { reviewerIdx: 25, rating: 4, comment: "Great quality for the price. The citrus blend is very refreshing after long study sessions." },
      { reviewerIdx: 43, rating: 5, comment: "Hand-poured candles with such attention to detail. You can tell a lot of care went into making these." },
      { reviewerIdx: 65, rating: 4, comment: "Lovely scents and burns cleanly without any black smoke. Will definitely order again!" },
      { reviewerIdx: 85, rating: 5, comment: "Bought two as gifts and kept one for myself. Everyone loved them. Highly recommend." },
      { reviewerIdx: 105, rating: 5, comment: "The soy wax formula is much better than paraffin. Great for the environment and smells divine." },
      { reviewerIdx: 125, rating: 4, comment: "Good value and the scent throw is impressive. The sandalwood blend is my favourite." },
    ],
  },

  // 2. Resin Trinket Trays — seller: Darshini Kumar (ISE, idx 41)
  {
    sellerIdx: 41,
    title: "Resin Trinket Trays",
    description:
      "Stylish, one-of-a-kind resin trays perfect for keeping your keys, coins, or jewelry organized on your desk.",
    price: "349.00",
    category: "handmade",
    extraRaterIdxs: [3, 6, 10, 21, 26, 61, 63, 81, 83, 101, 103, 121, 123, 140],
    reviews: [
      { reviewerIdx: 0,  rating: 5, comment: "Absolutely beautiful! The marbled effect looks stunning on my study table. Very well-made." },
      { reviewerIdx: 20, rating: 5, comment: "Got one for my sister and she absolutely loves it. The colours are so vibrant and unique." },
      { reviewerIdx: 45, rating: 4, comment: "Great quality resin work. The edges are smooth and the finish is glossy and professional." },
      { reviewerIdx: 60, rating: 5, comment: "This is the most beautiful desk accessory I own. Worth every rupee. Excellent craftsmanship." },
      { reviewerIdx: 80, rating: 4, comment: "Ordered the teal and gold variant. It looks exactly like the picture — really impressed!" },
      { reviewerIdx: 100, rating: 5, comment: "Perfect for organizing my rings and earrings. Sturdy and looks very premium." },
      { reviewerIdx: 120, rating: 4, comment: "Lovely piece. The seller was also very accommodating with a custom colour request." },
    ],
  },

  // 3. Macramé Wall Hangings — seller: Poornima Shenoy (ECE, idx 83)
  {
    sellerIdx: 83,
    title: "Macramé Wall Hangings",
    description:
      "Add a touch of boho aesthetic to your dorm or room with these intricate, handcrafted fiber art wall hangings.",
    price: "599.00",
    category: "handmade",
    extraRaterIdxs: [1, 4, 8, 22, 27, 40, 44, 61, 64, 101, 104, 121, 124, 141, 143],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "This transformed my boring hostel room into something straight out of Pinterest. Stunning work!" },
      { reviewerIdx: 21, rating: 5, comment: "The knots are so intricate and the cotton rope quality is excellent. Very impressed." },
      { reviewerIdx: 42, rating: 4, comment: "Looks beautiful on my wall. Took a while to arrive but totally worth the wait." },
      { reviewerIdx: 63, rating: 5, comment: "My roommates won't stop asking where I got this. Truly a piece of art." },
      { reviewerIdx: 102, rating: 5, comment: "Great attention to detail. The fringe at the bottom adds a nice boho touch." },
      { reviewerIdx: 122, rating: 4, comment: "Well-made and looks great. I'd love to see more size options in the future." },
      { reviewerIdx: 142, rating: 5, comment: "Perfect for my room makeover project. The natural cotton texture is exactly what I wanted." },
      { reviewerIdx: 5,  rating: 4, comment: "Good craft work. Hangs straight and the design is very elegant." },
    ],
  },

  // 4. Hand-Painted Terracotta Planters — seller: Rekha Sharma (EEE, idx 103)
  {
    sellerIdx: 103,
    title: "Hand-Painted Terracotta Planters",
    description:
      "Brighten up your study space with these vibrant, hand-painted pots—the perfect home for your new succulent.",
    price: "199.00",
    category: "handmade",
    extraRaterIdxs: [7, 9, 12, 23, 28, 43, 46, 62, 66, 82, 86, 122, 125, 143, 145],
    reviews: [
      { reviewerIdx: 0,  rating: 5, comment: "Bought two for my succulents and they look adorable! The painting is really detailed and colourful." },
      { reviewerIdx: 20, rating: 4, comment: "Unique hand-painted designs that I haven't seen anywhere else. Great value for money." },
      { reviewerIdx: 40, rating: 5, comment: "The pot arrived safely wrapped and the paint is vibrant. My plants look so happy in them!" },
      { reviewerIdx: 60, rating: 5, comment: "Beautiful craftsmanship. Each pot looks unique. Brightened up my balcony instantly." },
      { reviewerIdx: 80, rating: 4, comment: "Good quality and very pretty. The mandala pattern on mine is so intricate." },
      { reviewerIdx: 120, rating: 5, comment: "Gifted one to my friend and she was delighted. Packaging was also very careful." },
      { reviewerIdx: 140, rating: 4, comment: "Lovely planters. Would love to see even more design options." },
    ],
  },

  // 5. Beaded Crystal Bracelets — seller: Ananya Krishnan (AIML, idx 3)
  {
    sellerIdx: 3,
    title: "Beaded Crystal Bracelets",
    description:
      "Minimalist, handcrafted beaded bracelets designed to bring a little extra positive energy to your daily outfit.",
    price: "149.00",
    category: "fashion",
    extraRaterIdxs: [5, 8, 14, 25, 30, 44, 47, 61, 65, 81, 84, 100, 106, 121, 126, 141],
    reviews: [
      { reviewerIdx: 1,  rating: 5, comment: "So pretty and delicate! The rose quartz bracelet is exactly what I wanted. Fits perfectly." },
      { reviewerIdx: 22, rating: 5, comment: "Ordered three bracelets and each one is more beautiful than the last. Great quality elastic." },
      { reviewerIdx: 42, rating: 4, comment: "Very cute and dainty. The beads are smooth and the crystals look genuine." },
      { reviewerIdx: 62, rating: 5, comment: "I wear mine every day! It holds up really well and still looks as good as new." },
      { reviewerIdx: 82, rating: 4, comment: "Lovely bracelet. I got the amethyst one and the colour is gorgeous." },
      { reviewerIdx: 101, rating: 5, comment: "Gifted this to my best friend and she loves it. So thoughtful and well-made." },
      { reviewerIdx: 120, rating: 4, comment: "Good quality for the price. Would definitely recommend to friends." },
      { reviewerIdx: 140, rating: 5, comment: "Absolutely beautiful. Stacks well with other bracelets too." },
    ],
  },

  // 6. Customized Planner Stickers — seller: Swati Mishra (CSE, idx 21)
  {
    sellerIdx: 21,
    title: "Customized Planner Stickers",
    description:
      "Get organized with my pack of hand-designed, aesthetic stickers tailored for bullet journaling and daily task tracking.",
    price: "99.00",
    category: "stationery",
    extraRaterIdxs: [0, 4, 10, 23, 27, 41, 46, 60, 64, 81, 85, 102, 107, 123, 127],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "These stickers are so adorable and perfectly sized for my bullet journal. Love them!" },
      { reviewerIdx: 20, rating: 5, comment: "High quality print, colours don't bleed and they peel off cleanly. Exactly what I needed." },
      { reviewerIdx: 40, rating: 4, comment: "Cute designs and good paper quality. Makes my planner look so aesthetic." },
      { reviewerIdx: 61, rating: 5, comment: "Got a custom pack with my name on some stickers. Seller was super responsive and creative." },
      { reviewerIdx: 83, rating: 4, comment: "Great variety in one pack. I use them for my study schedule and they keep me motivated." },
      { reviewerIdx: 100, rating: 5, comment: "Sturdy stickers that don't leave residue when removed. Perfect for my Hobonichi planner." },
      { reviewerIdx: 122, rating: 4, comment: "So helpful for organizing. The to-do list stickers are my favourite." },
    ],
  },

  // 7. Handmade Bookmarks — seller: Harini Rajan (ISE, idx 49)
  {
    sellerIdx: 49,
    title: "Handmade Bookmarks",
    description:
      "Beautifully crafted bookmarks using high-quality cardstock and pressed flowers—a must-have for every late-night study session.",
    price: "79.00",
    category: "stationery",
    extraRaterIdxs: [1, 6, 11, 20, 28, 40, 47, 61, 65, 80, 86, 101, 108, 120, 127, 141],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "The pressed flower bookmark is the most beautiful thing I own. It looks like art." },
      { reviewerIdx: 22, rating: 5, comment: "Such a thoughtful product. The laminated finish keeps the flowers looking fresh." },
      { reviewerIdx: 42, rating: 4, comment: "Lovely quality and a great price. Bought five as gifts and everyone was impressed." },
      { reviewerIdx: 60, rating: 5, comment: "My reading experience feels elevated with these. The dried lavender one is my favourite." },
      { reviewerIdx: 82, rating: 4, comment: "Good craftsmanship. They're sturdy and don't bend easily. Very happy with my purchase." },
      { reviewerIdx: 100, rating: 5, comment: "Perfect little gift. The packaging was also adorable with a handwritten note." },
      { reviewerIdx: 121, rating: 4, comment: "Beautiful bookmarks. The colours of the pressed flowers are so vibrant." },
    ],
  },

  // 8. Personalized Notebook Covers — seller: Rishita Kapoor (ECE, idx 85)
  {
    sellerIdx: 85,
    title: "Personalized Notebook Covers",
    description:
      "I create durable, custom-designed fabric covers for your standard notebooks to keep your notes protected and stylish.",
    price: "179.00",
    category: "stationery",
    extraRaterIdxs: [3, 7, 12, 21, 29, 41, 48, 62, 66, 80, 88, 103, 109, 122, 128, 142],
    reviews: [
      { reviewerIdx: 0,  rating: 5, comment: "My notebooks look so professional now! The fabric quality is great and the stitching is perfect." },
      { reviewerIdx: 20, rating: 5, comment: "Ordered with my initials embroidered and it came out beautifully. Very sturdy." },
      { reviewerIdx: 40, rating: 4, comment: "The fabric cover is so much better than the plain paper cover. Keeps my notes safe." },
      { reviewerIdx: 60, rating: 5, comment: "Great quality and the customization options are excellent. Seller delivered ahead of schedule." },
      { reviewerIdx: 100, rating: 4, comment: "Fits standard A5 notebooks perfectly. The pattern I chose looks amazing." },
      { reviewerIdx: 120, rating: 5, comment: "Such a useful product for college students. My notes are finally protected and stylish." },
      { reviewerIdx: 141, rating: 4, comment: "Really nice cover. Would love to see more fabric patterns to choose from." },
    ],
  },

  // 9. Academic Success Templates (Digital) — seller: Shreya Iyer (AIML, idx 5)
  {
    sellerIdx: 5,
    title: "Academic Success Templates (Digital)",
    description:
      "Streamlined, ready-to-use Notion templates designed specifically to help students track assignments and exam schedules.",
    price: "129.00",
    category: "digital",
    extraRaterIdxs: [1, 4, 9, 20, 24, 40, 45, 61, 66, 81, 86, 101, 106, 121, 126, 141, 143],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "This Notion template has completely transformed how I manage my semester. Absolutely love it!" },
      { reviewerIdx: 22, rating: 5, comment: "The assignment tracker is genius. I haven't missed a deadline since I started using this." },
      { reviewerIdx: 42, rating: 4, comment: "Well-designed and easy to customize. Worth the price for sure." },
      { reviewerIdx: 62, rating: 5, comment: "Shared this with my whole study group. Everyone finds it incredibly useful." },
      { reviewerIdx: 82, rating: 4, comment: "Clean design and very practical. The exam countdown feature is my favourite." },
      { reviewerIdx: 102, rating: 5, comment: "I was skeptical at first but this template genuinely improved my academic performance." },
      { reviewerIdx: 122, rating: 4, comment: "Great value. Setup was quick and instructions were clear. Highly recommended." },
      { reviewerIdx: 142, rating: 5, comment: "Best purchase I've made this semester. The habit tracker section is a game changer." },
    ],
  },

  // 10. Custom Vinyl Laptop Decals — seller: Pavitra Nair (CSE, idx 23)
  {
    sellerIdx: 23,
    title: "Custom Vinyl Laptop Decals",
    description:
      "Express your personality with durable, custom-cut vinyl stickers designed specifically for your laptop or water bottle.",
    price: "119.00",
    category: "accessories",
    extraRaterIdxs: [2, 6, 11, 22, 27, 41, 46, 62, 66, 82, 87, 101, 107, 121, 127, 142],
    reviews: [
      { reviewerIdx: 0,  rating: 5, comment: "My laptop looks so cool now! The print quality is sharp and the vinyl is thick and durable." },
      { reviewerIdx: 20, rating: 5, comment: "Ordered a custom design with my favourite quote and it came out perfectly." },
      { reviewerIdx: 40, rating: 4, comment: "Good quality vinyl that doesn't peel at the edges. Very happy with the purchase." },
      { reviewerIdx: 60, rating: 5, comment: "The colour accuracy is spot on. Looks exactly like the design I submitted." },
      { reviewerIdx: 80, rating: 4, comment: "Affordable and well-made. Friends keep asking where I got my laptop decal from." },
      { reviewerIdx: 100, rating: 5, comment: "Perfect gift idea too. Got one for myself and one for my friend. Both loved them." },
      { reviewerIdx: 120, rating: 4, comment: "Easy to apply with no bubbles if you follow the instructions. Great product." },
    ],
  },

  // 11. Crochet Plushies (Amigurumi) — seller: Fatima Sheikh (ISE, idx 45)
  {
    sellerIdx: 45,
    title: "Crochet Plushies (Amigurumi)",
    description:
      "Cute, soft, and handmade crochet companions that make the perfect desk buddy or small gift for a friend.",
    price: "299.00",
    category: "handmade",
    extraRaterIdxs: [1, 5, 10, 20, 25, 42, 48, 61, 65, 80, 85, 102, 108, 122, 128, 143],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "The tiny bunny plushie is the cutest thing I've ever owned. The detail in the stitching is incredible." },
      { reviewerIdx: 22, rating: 5, comment: "Bought one as a birthday gift for my friend and she screamed when she saw it. Adorable!" },
      { reviewerIdx: 40, rating: 4, comment: "Super soft and well-made. The stuffing is firm but not too hard. Perfect desk companion." },
      { reviewerIdx: 60, rating: 5, comment: "I ordered a custom bear and the seller made it exactly like I imagined. So talented!" },
      { reviewerIdx: 81, rating: 4, comment: "Great quality crochet work. The colours are vibrant and don't fade after washing." },
      { reviewerIdx: 100, rating: 5, comment: "These are absolute stress relievers! I hug mine before every exam. Works like a charm." },
      { reviewerIdx: 121, rating: 5, comment: "The attention to detail is remarkable for the price. Highly recommend." },
      { reviewerIdx: 141, rating: 4, comment: "Really cute and well-crafted. Delivery was quick too." },
    ],
  },

  // 12. Hand-Sewn Canvas Tote Bags — seller: Nandita Rao (ECE, idx 89)
  {
    sellerIdx: 89,
    title: "Hand-Sewn Canvas Tote Bags",
    description:
      "Durable, eco-friendly tote bags perfect for carrying your heavy textbooks and laptop across campus in style.",
    price: "279.00",
    category: "fashion",
    extraRaterIdxs: [0, 4, 9, 21, 26, 41, 46, 63, 67, 81, 86, 100, 106, 123, 129, 143, 145],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "This bag carries all my textbooks without any strain on the handles. Extremely durable." },
      { reviewerIdx: 20, rating: 5, comment: "Love that it's eco-friendly. The stitching is really strong and the inner pocket is handy." },
      { reviewerIdx: 40, rating: 4, comment: "Very spacious and stylish. I've been using it daily for three months and it still looks new." },
      { reviewerIdx: 61, rating: 5, comment: "The canvas quality is much better than store-bought bags. Absolutely worth the price." },
      { reviewerIdx: 82, rating: 4, comment: "Good size and the custom print option is a great touch. Very satisfied." },
      { reviewerIdx: 103, rating: 5, comment: "Perfect campus bag. It fits my laptop, water bottle, and all my notebooks easily." },
      { reviewerIdx: 122, rating: 4, comment: "Strong and practical. The natural canvas colour looks so clean and minimal." },
    ],
  },

  // 13. Silk Scrunchies & Headbands — seller: Sumitha Reddy (EEE, idx 101)
  {
    sellerIdx: 101,
    title: "Silk Scrunchies & Headbands",
    description:
      "Soft, hair-friendly accessories handmade in various colors and patterns to match any of your daily looks.",
    price: "89.00",
    category: "fashion",
    extraRaterIdxs: [1, 5, 11, 20, 26, 40, 47, 60, 66, 80, 87, 121, 126, 141, 146, 3],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "Silk scrunchies are a total game changer for my hair. Zero breakage and so gentle!" },
      { reviewerIdx: 22, rating: 5, comment: "The colours are exactly as shown. Got a set of five and wear a different one every day." },
      { reviewerIdx: 42, rating: 4, comment: "Really good quality silk. Much better than the ones sold in shops. Hair looks healthy." },
      { reviewerIdx: 62, rating: 5, comment: "Bought as gifts for my friends and everyone loves them. Packaging was super cute too." },
      { reviewerIdx: 82, rating: 4, comment: "The headbands are so comfortable. Don't slip and look very stylish." },
      { reviewerIdx: 120, rating: 5, comment: "Absolutely love these! The scrunchies hold well without pulling or creasing my hair." },
      { reviewerIdx: 140, rating: 4, comment: "Great product at a fair price. The floral print scrunchie is my favourite." },
    ],
  },

  // 14. Custom Embroidered Caps — seller: Bhoomika Hegde (ECE, idx 91)
  {
    sellerIdx: 91,
    title: "Custom Embroidered Caps",
    description:
      "I offer custom embroidery services for plain caps, adding your initials or a small, unique design to make it your own.",
    price: "499.00",
    category: "fashion",
    extraRaterIdxs: [2, 6, 11, 21, 27, 40, 45, 60, 65, 81, 88, 102, 108, 120, 127, 141, 146],
    reviews: [
      { reviewerIdx: 0,  rating: 5, comment: "The embroidery on my cap is flawless. Clean stitches and exactly the font I requested." },
      { reviewerIdx: 22, rating: 5, comment: "Got my initials done in a classic style. It looks so premium and personalised." },
      { reviewerIdx: 42, rating: 4, comment: "Good quality base cap and the embroidery is tight and professional. Very happy!" },
      { reviewerIdx: 61, rating: 5, comment: "Ordered custom caps for our friend group with our names. They turned out amazing!" },
      { reviewerIdx: 80, rating: 4, comment: "The stitching holds up really well even after washing. Impressed by the durability." },
      { reviewerIdx: 101, rating: 5, comment: "Fantastic work! The design came out exactly as I described. Very talented." },
      { reviewerIdx: 122, rating: 4, comment: "Great custom accessory. Delivery was on time and packaging was secure." },
      { reviewerIdx: 143, rating: 5, comment: "Beautifully done. Worth every rupee for the level of customization." },
    ],
  },

  // 15. Artisan Lip Balms — seller: Lavanya Menon (ISE, idx 57)
  {
    sellerIdx: 57,
    title: "Artisan Lip Balms",
    description:
      "Keep your lips hydrated with these all-natural, handmade balms crafted from organic beeswax and essential oils.",
    price: "119.00",
    category: "beauty",
    extraRaterIdxs: [1, 5, 10, 20, 24, 41, 46, 61, 66, 81, 86, 100, 107, 121, 127, 141],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "These lip balms are incredible. My lips have never been this soft. The rose one is divine." },
      { reviewerIdx: 22, rating: 5, comment: "All-natural ingredients and it shows. No artificial smell and absorbs quickly." },
      { reviewerIdx: 40, rating: 4, comment: "Really hydrating formula. I stopped buying store-bought balms after trying these." },
      { reviewerIdx: 60, rating: 5, comment: "Got a set of three flavours. The vanilla and mint are my favourites. Love them!" },
      { reviewerIdx: 82, rating: 4, comment: "Very moisturizing and lasts throughout the day. Great for dry Bangalore weather." },
      { reviewerIdx: 100, rating: 5, comment: "Gifted these to my sister and she was thrilled. Packaging is minimal and eco-friendly." },
      { reviewerIdx: 120, rating: 4, comment: "Lovely product. The texture is perfect — not too thick or waxy." },
    ],
  },

  // 16. Gourmet Cookie Boxes — seller: Divya Menon (AIML, idx 9)
  {
    sellerIdx: 9,
    title: "Gourmet Cookie Boxes",
    description:
      "Freshly baked, artisan cookie assortments that are perfect for late-night cravings or sharing with your roommates.",
    price: "329.00",
    category: "food",
    extraRaterIdxs: [0, 3, 7, 21, 26, 40, 45, 60, 65, 80, 86, 101, 107, 121, 127, 141, 143],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "The double chocolate chip cookies are absolutely incredible. Moist, chewy, and perfectly baked." },
      { reviewerIdx: 20, rating: 5, comment: "Ordered a box for our study group and the cookies were devoured in minutes. Everyone loved them!" },
      { reviewerIdx: 42, rating: 4, comment: "Great variety in the assortment box. The brownie cookies were my personal favourite." },
      { reviewerIdx: 61, rating: 5, comment: "Freshly baked and delivered on time. Hands down the best cookies I've had on campus." },
      { reviewerIdx: 83, rating: 4, comment: "The cookies stayed fresh for three days. Loved the sea-salt caramel variety." },
      { reviewerIdx: 102, rating: 5, comment: "Perfect treat for exam season. Each cookie is generously sized and so flavourful." },
      { reviewerIdx: 122, rating: 4, comment: "Really good cookies! The packaging keeps them fresh and they make a great gift." },
    ],
  },

  // 17. Customized Gift Hampers — seller: Keerthana Bhat (CSE, idx 33)
  {
    sellerIdx: 33,
    title: "Customized Gift Hampers",
    description:
      "I curate themed gift boxes filled with handmade items like candles, snacks, and stationery—the ultimate 'care package' for finals week.",
    price: "799.00",
    category: "gifts",
    extraRaterIdxs: [1, 4, 9, 20, 27, 40, 46, 60, 66, 81, 87, 101, 108, 120, 128, 141, 145],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "Got a hamper for my roommate's birthday and she was absolutely overwhelmed. So thoughtful!" },
      { reviewerIdx: 22, rating: 5, comment: "The attention to detail in the curation is impressive. Every item felt intentional." },
      { reviewerIdx: 41, rating: 4, comment: "Ordered a 'finals survival' hamper and it had everything I needed. Amazing idea!" },
      { reviewerIdx: 63, rating: 5, comment: "Beautiful packaging and every item inside was high quality. Worth every rupee." },
      { reviewerIdx: 83, rating: 5, comment: "The custom hamper service is brilliant. Seller communicated well and delivered on time." },
      { reviewerIdx: 103, rating: 4, comment: "A wonderful and unique gifting option. Far more personal than a store-bought gift." },
      { reviewerIdx: 123, rating: 5, comment: "My friend was so happy with the hamper. It felt like it was made with so much love." },
      { reviewerIdx: 143, rating: 4, comment: "Excellent service and beautifully presented. Will order again for the next occasion." },
    ],
  },

  // 18. Hand-Blended Tea Sachets — seller: Esha Verma (ISE, idx 43)
  {
    sellerIdx: 43,
    title: "Hand-Blended Tea Sachets",
    description:
      "Relax with my signature blends of herbal tea, hand-packed in eco-friendly sachets for a quick, calming break.",
    price: "189.00",
    category: "food",
    extraRaterIdxs: [0, 4, 8, 20, 25, 41, 47, 61, 65, 80, 87, 101, 108, 121, 127, 142],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "The chamomile lavender blend helps me sleep so well before exams. Absolutely love it!" },
      { reviewerIdx: 22, rating: 5, comment: "High quality herbs and the eco-friendly sachets are a great touch. Brewing is effortless." },
      { reviewerIdx: 42, rating: 4, comment: "I've tried all three blends. The mint green tea is perfect for morning study sessions." },
      { reviewerIdx: 62, rating: 5, comment: "So relaxing and natural. No artificial flavours. This is real, honest tea." },
      { reviewerIdx: 83, rating: 4, comment: "Great product for self-care. The packaging is minimal and the tea is genuinely calming." },
      { reviewerIdx: 100, rating: 5, comment: "Started my morning routine with this tea and I feel so much better. Highly recommend." },
      { reviewerIdx: 120, rating: 4, comment: "Good flavour and excellent quality. Sharing this with my whole family." },
    ],
  },

  // 19. Decorative Keychains — seller: Nithya Suresh (CSE, idx 29)
  {
    sellerIdx: 29,
    title: "Decorative Keychains",
    description:
      "Unique, handmade resin or bead keychains that add a pop of color and personality to your backpack or keys.",
    price: "89.00",
    category: "accessories",
    extraRaterIdxs: [1, 5, 10, 21, 26, 40, 45, 60, 65, 81, 86, 101, 107, 121, 127, 141, 146],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "The resin keychain I ordered has a tiny flower inside it. Looks absolutely magical!" },
      { reviewerIdx: 20, rating: 4, comment: "Good quality and very creative designs. The colours are bright and don't fade." },
      { reviewerIdx: 41, rating: 5, comment: "My keys have never looked this cute. The custom name tag option is really fun." },
      { reviewerIdx: 61, rating: 4, comment: "Sturdy metal ring and the resin piece is well-sealed and durable. Happy with it." },
      { reviewerIdx: 82, rating: 5, comment: "Got the galaxy resin one and it's so unique. I always get compliments on it." },
      { reviewerIdx: 100, rating: 4, comment: "Great small gift option. Ordered five as return gifts and everyone loved them." },
      { reviewerIdx: 120, rating: 5, comment: "Such a lovely accessory. The craftsmanship is really good for the price." },
    ],
  },

  // 20. Miniature Canvas Art — seller: Pooja Rao (AIML, idx 15)
  {
    sellerIdx: 15,
    title: "Miniature Canvas Art",
    description:
      "Small, original statement art pieces that are perfect for decorating cramped dorm walls or gifting to friends on a budget.",
    price: "219.00",
    category: "art",
    extraRaterIdxs: [0, 4, 8, 21, 26, 41, 46, 61, 66, 81, 87, 101, 108, 121, 128, 142, 146],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "The miniature sunset painting is breathtaking. Such rich colours in such a small canvas." },
      { reviewerIdx: 20, rating: 5, comment: "Ordered two pieces for my room and they make the space look so artistic and cosy." },
      { reviewerIdx: 40, rating: 4, comment: "Good quality canvas and paint. Each piece is unique which makes it feel special." },
      { reviewerIdx: 60, rating: 5, comment: "Genuinely talented artist. The mountain landscape painting looks like a photograph." },
      { reviewerIdx: 83, rating: 4, comment: "Lovely little art pieces. Great conversation starters when people visit my room." },
      { reviewerIdx: 102, rating: 5, comment: "I gifted one to my professor and she was very touched. Truly beautiful work." },
      { reviewerIdx: 122, rating: 4, comment: "Perfect dorm decor. The frames are sturdy and the hooks on the back work well." },
      { reviewerIdx: 143, rating: 5, comment: "One of the best purchases I've made. Original art at a student-friendly price." },
    ],
  },
];

// ─── Freelance Listings ───────────────────────────────────────────────────────

export const FREELANCE_LISTINGS: FreelanceListing[] = [
  // 1. AI Prompt Engineering & Automation — provider: Arjun Sharma (AIML, idx 0)
  {
    providerIdx: 0,
    title: "AI Prompt Engineering & Automation",
    description:
      "Beyond simple usage, businesses now pay for professionals who can build custom AI workflows, chatbots, and optimized prompts to improve operational efficiency.",
    price: "999.00",
    category: "AI & Automation",
    deliveryDays: 5,
    extraRaterIdxs: [2, 5, 10, 20, 25, 41, 46, 61, 66, 82, 87, 101, 107, 122, 127, 141],
    reviews: [
      { reviewerIdx: 1,  rating: 5, comment: "Built a custom AI chatbot for our college club's Instagram. Responses are eerily accurate. Great work!" },
      { reviewerIdx: 22, rating: 5, comment: "The prompt templates Arjun created for my research summarization workflow saved me hours every week." },
      { reviewerIdx: 42, rating: 4, comment: "Very knowledgeable about LLMs and chain-of-thought prompting. Delivered on time with clear documentation." },
      { reviewerIdx: 62, rating: 5, comment: "Helped automate our event management club's emails using AI. The system works flawlessly." },
      { reviewerIdx: 83, rating: 4, comment: "Good understanding of AI tools and APIs. The automation pipeline he built is very efficient." },
      { reviewerIdx: 100, rating: 5, comment: "Top-tier work! Helped me set up a Notion AI integration that I use every single day." },
      { reviewerIdx: 121, rating: 4, comment: "Responsive and professional. Delivered exactly what was promised and even added extra features." },
      { reviewerIdx: 142, rating: 5, comment: "Excellent prompt engineer. My productivity has doubled since implementing his workflows." },
    ],
  },

  // 2. Web Development — provider: Siddharth Chauhan (CSE, idx 20)
  {
    providerIdx: 20,
    title: "Web Development",
    description:
      "Core development (React, Next.js, WordPress) remains essential, with added demand for integrating AI APIs and no-code/low-code solutions (e.g., Webflow, Framer).",
    price: "1499.00",
    category: "Web Development",
    deliveryDays: 10,
    extraRaterIdxs: [1, 5, 11, 22, 27, 41, 47, 60, 66, 81, 87, 101, 108, 123, 128, 143],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "Built a full portfolio website for me in React. It looks stunning and loads super fast." },
      { reviewerIdx: 21, rating: 5, comment: "Siddharth built our college fest website from scratch. It handled 500+ registrations smoothly!" },
      { reviewerIdx: 42, rating: 4, comment: "Great developer with clean code and good communication. Delivered ahead of the deadline." },
      { reviewerIdx: 61, rating: 5, comment: "Integrated a Razorpay payment gateway into our club's website. Works perfectly every time." },
      { reviewerIdx: 82, rating: 4, comment: "Good Next.js skills and responsive design. The mobile version of my site looks flawless." },
      { reviewerIdx: 102, rating: 5, comment: "Best developer on campus. Very professional and the final product exceeded my expectations." },
      { reviewerIdx: 122, rating: 4, comment: "Fast, reliable and skilled. Would definitely hire again for future projects." },
    ],
  },

  // 3. UI/UX Design — provider: Vivek Singhania (ISE, idx 40)
  {
    providerIdx: 40,
    title: "UI/UX Design",
    description:
      "Creating intuitive digital interfaces using tools like Figma continues to be a high-value skill as companies prioritize user retention and engagement.",
    price: "799.00",
    category: "Design",
    deliveryDays: 7,
    extraRaterIdxs: [2, 5, 11, 21, 27, 42, 47, 61, 66, 81, 87, 100, 108, 122, 129, 142, 146],
    reviews: [
      { reviewerIdx: 1,  rating: 5, comment: "Designed the entire UI for our startup app in Figma. The user flow is seamless and beautiful." },
      { reviewerIdx: 20, rating: 5, comment: "Vivek's attention to detail is phenomenal. Our app's design got praised by our college mentors." },
      { reviewerIdx: 43, rating: 4, comment: "Delivered a complete design system with components, spacing, and colour guidelines. Very professional." },
      { reviewerIdx: 62, rating: 5, comment: "Redesigned our NGO's website wireframes. The new design increased user engagement significantly." },
      { reviewerIdx: 83, rating: 4, comment: "Great Figma skills and good understanding of user psychology. Highly recommend." },
      { reviewerIdx: 101, rating: 5, comment: "The prototype he created for my final-year project was a huge hit during the presentation." },
      { reviewerIdx: 123, rating: 4, comment: "Very creative and responsive designer. Incorporated all feedback without any issues." },
      { reviewerIdx: 144, rating: 5, comment: "Outstanding work! The design is modern, clean, and very user-friendly." },
    ],
  },

  // 4. Digital Marketing & SEO — provider: Lokesh Bandi (IOT, idx 60)
  {
    providerIdx: 60,
    title: "Digital Marketing & SEO",
    description:
      "Modern marketing requires a data-driven approach, focusing on SEO strategy, performance marketing (paid ads), and marketing automation.",
    price: "699.00",
    category: "Marketing",
    deliveryDays: 7,
    extraRaterIdxs: [1, 5, 11, 22, 27, 41, 47, 62, 66, 82, 87, 101, 107, 123, 128, 143],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "Lokesh ran a Google Ads campaign for our small business project. We got 3x more reach in two weeks." },
      { reviewerIdx: 20, rating: 5, comment: "Excellent SEO strategy. Our blog went from page 5 to page 1 on Google in just one month!" },
      { reviewerIdx: 40, rating: 4, comment: "Very knowledgeable about keyword research and on-page SEO. Clear reports and good results." },
      { reviewerIdx: 63, rating: 5, comment: "Managed our Instagram and YouTube growth for the semester. Followers grew by 40%." },
      { reviewerIdx: 83, rating: 4, comment: "Good understanding of analytics and conversion funnels. Solid ROI on ad spend." },
      { reviewerIdx: 103, rating: 5, comment: "Helped our fest committee reach more students through targeted social media ads. Brilliant!" },
      { reviewerIdx: 122, rating: 4, comment: "Professional and data-driven approach. Our online presence has improved significantly." },
    ],
  },

  // 5. Content Writing & Copywriting — provider: Rahul Venkatesh (AIML, idx 2)
  {
    providerIdx: 2,
    title: "Content Writing & Copywriting",
    description:
      "Moving beyond generic articles, there is a premium on technical writing, SEO-driven content, and persuasive copywriting that drives conversions.",
    price: "499.00",
    category: "Writing",
    deliveryDays: 4,
    extraRaterIdxs: [0, 4, 9, 20, 26, 41, 47, 61, 67, 81, 87, 100, 108, 120, 128, 142, 146],
    reviews: [
      { reviewerIdx: 1,  rating: 5, comment: "Rahul wrote a compelling pitch deck narrative for our startup. Investors were very impressed." },
      { reviewerIdx: 22, rating: 5, comment: "Excellent writing skills. The blog posts he wrote for us rank well and are genuinely engaging." },
      { reviewerIdx: 40, rating: 4, comment: "Very professional and understands technical topics well. Delivered clean, readable content." },
      { reviewerIdx: 61, rating: 5, comment: "Wrote our club's newsletter and it got the most engagement we've ever had. Brilliant writer." },
      { reviewerIdx: 84, rating: 4, comment: "Good research skills and SEO optimization. The articles he wrote brought real traffic." },
      { reviewerIdx: 101, rating: 5, comment: "Polished our LinkedIn company page copy and the profile views went up immediately." },
      { reviewerIdx: 123, rating: 4, comment: "Responsive and articulate. Captures the brand voice perfectly without any revision needed." },
    ],
  },

  // 6. Video Editing & Short-Form Production — provider: Akash Rajput (CSE, idx 22)
  {
    providerIdx: 22,
    title: "Video Editing & Short-Form Production",
    description:
      "With the rise of short-form social media content, editors who understand platform-specific retention, hooks, and pacing are in high demand.",
    price: "899.00",
    category: "Video & Media",
    deliveryDays: 5,
    extraRaterIdxs: [0, 4, 10, 21, 27, 40, 46, 61, 66, 81, 87, 100, 107, 120, 128, 142],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "Akash edited our college fest recap reel and it went viral within our campus community. Amazing!" },
      { reviewerIdx: 20, rating: 5, comment: "Created a series of Instagram Reels for our club. Watch time is through the roof. Great hooks!" },
      { reviewerIdx: 41, rating: 4, comment: "Very good at pacing and transitions. The final video looked incredibly professional." },
      { reviewerIdx: 60, rating: 5, comment: "Edited our hackathon promotional video in 24 hours. Delivered under pressure with top quality." },
      { reviewerIdx: 82, rating: 4, comment: "Good colour grading and sound design. The video engagement rate improved a lot." },
      { reviewerIdx: 101, rating: 5, comment: "Best editor on campus. Understands storytelling through video very well." },
      { reviewerIdx: 123, rating: 5, comment: "Our department's YouTube channel finally looks professional thanks to Akash. Excellent work!" },
      { reviewerIdx: 143, rating: 4, comment: "Fast turnaround and great output. Highly recommend for any video content needs." },
    ],
  },

  // 7. Data Analytics — provider: Ankit Mehta (ISE, idx 42)
  {
    providerIdx: 42,
    title: "Data Analytics",
    description:
      "Businesses rely heavily on freelancers who can collect, visualize, and extract actionable insights from data using tools like SQL, Python, or Tableau.",
    price: "1199.00",
    category: "Data & Analytics",
    deliveryDays: 8,
    extraRaterIdxs: [0, 5, 10, 20, 26, 41, 47, 60, 66, 81, 87, 101, 108, 121, 128, 143],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "Analysed three semesters of exam data for our department and the insights were incredibly valuable." },
      { reviewerIdx: 22, rating: 5, comment: "Built a sales dashboard in Tableau for our mini-enterprise project. Got full marks!" },
      { reviewerIdx: 40, rating: 4, comment: "Strong Python and Pandas skills. The analysis was thorough and well-documented." },
      { reviewerIdx: 61, rating: 5, comment: "Helped clean and visualise a large dataset for our research project. Saved us days of work." },
      { reviewerIdx: 83, rating: 4, comment: "Good at SQL queries and creating meaningful visualisations. Delivered quality insights." },
      { reviewerIdx: 100, rating: 5, comment: "Ankit's Excel automation scripts saved our club hours of manual work every month." },
      { reviewerIdx: 122, rating: 4, comment: "Very professional approach to data. Clear explanations and actionable recommendations." },
    ],
  },

  // 8. Cybersecurity Consulting — provider: Manoj Kumar (IOT, idx 62)
  {
    providerIdx: 62,
    title: "Cybersecurity Consulting",
    description:
      "As digital threats evolve, freelancers skilled in ethical hacking, security audits, and data protection are increasingly sought after by businesses of all sizes.",
    price: "1299.00",
    category: "Cybersecurity",
    deliveryDays: 6,
    extraRaterIdxs: [0, 5, 10, 21, 27, 41, 47, 61, 67, 81, 87, 100, 108, 122, 129, 143, 145],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "Conducted a security audit for our web app and found three critical vulnerabilities. Lifesaver!" },
      { reviewerIdx: 20, rating: 5, comment: "Helped us secure our club's database and set up proper access controls. Very thorough work." },
      { reviewerIdx: 40, rating: 4, comment: "Good knowledge of ethical hacking and penetration testing. Detailed report with clear fixes." },
      { reviewerIdx: 63, rating: 5, comment: "Set up 2FA and encryption for our student portal project. Implementation was clean and fast." },
      { reviewerIdx: 83, rating: 4, comment: "Professional and discreet. The security improvements he implemented are solid." },
      { reviewerIdx: 101, rating: 5, comment: "Trained our team on phishing awareness and password hygiene. Very practical session." },
      { reviewerIdx: 121, rating: 4, comment: "Knowledgeable consultant. Found and patched a SQL injection vulnerability in minutes." },
    ],
  },

  // 9. Social Media Strategy — provider: Priya Nair (AIML, idx 1)
  {
    providerIdx: 1,
    title: "Social Media Strategy",
    description:
      "Companies are looking for strategists who can own the full loop of content planning, engagement, and reporting, rather than just basic posting.",
    price: "599.00",
    category: "Marketing",
    deliveryDays: 5,
    extraRaterIdxs: [2, 6, 11, 20, 26, 41, 47, 60, 67, 81, 87, 100, 108, 122, 129, 143],
    reviews: [
      { reviewerIdx: 0,  rating: 5, comment: "Priya built a 3-month content calendar for our college club. Engagement tripled in 6 weeks!" },
      { reviewerIdx: 22, rating: 5, comment: "She understands algorithms, hashtag strategy, and audience psychology really well. Top tier!" },
      { reviewerIdx: 42, rating: 4, comment: "Created a proper content strategy with KPIs and monthly reviews. Very structured approach." },
      { reviewerIdx: 61, rating: 5, comment: "Our Instagram went from 200 to 800 followers in two months following her strategy. Incredible!" },
      { reviewerIdx: 83, rating: 4, comment: "Great at repurposing content across platforms. Our reach expanded to LinkedIn and Twitter too." },
      { reviewerIdx: 101, rating: 5, comment: "Professional social media audit followed by a clear action plan. Results speak for themselves." },
      { reviewerIdx: 123, rating: 4, comment: "Detailed monthly reports with clear insights. Made our social media efforts much more focused." },
      { reviewerIdx: 143, rating: 5, comment: "Best investment we made for our club's online presence. Highly recommend Priya's services." },
    ],
  },

  // 10. Virtual Assistance & Operations — provider: Ranjitha Shetty (CSE, idx 25)
  {
    providerIdx: 25,
    title: "Virtual Assistance & Operations",
    description:
      "Modern VAs act more like operations partners, managing complex tasks like inbox management, meeting rhythms, and project coordination for founders.",
    price: "449.00",
    category: "Operations",
    deliveryDays: 3,
    extraRaterIdxs: [0, 5, 10, 20, 27, 40, 47, 60, 66, 81, 87, 101, 108, 120, 128, 142],
    reviews: [
      { reviewerIdx: 2,  rating: 5, comment: "Ranjitha managed all our club admin for a full month. Zero tasks fell through the cracks." },
      { reviewerIdx: 21, rating: 5, comment: "Scheduled 15 meetings and prepared all agendas in under a day. Incredibly organized!" },
      { reviewerIdx: 41, rating: 4, comment: "Good communication and very reliable. Handled inbox management with complete discretion." },
      { reviewerIdx: 61, rating: 5, comment: "She set up our project tracking in Notion and it's the most organized our team has ever been." },
      { reviewerIdx: 83, rating: 4, comment: "Great operations mindset. Proactively flags issues before they become problems." },
      { reviewerIdx: 100, rating: 5, comment: "Managed our startup's operations for two weeks during our exams. Could not have survived without her." },
      { reviewerIdx: 122, rating: 4, comment: "Professional, punctual, and proactive. Exactly what you need in a virtual assistant." },
    ],
  },
];
