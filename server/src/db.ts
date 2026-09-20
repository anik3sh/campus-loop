import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const DB_PATH = path.join(dataDir, 'campus_loop.db');

export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      college TEXT DEFAULT 'Campus University',
      campus TEXT DEFAULT 'Main Campus',
      bio TEXT,
      phone TEXT,
      is_admin INTEGER DEFAULT 0,
      is_suspended INTEGER DEFAULT 0,
      response_rate INTEGER DEFAULT 95,
      total_sold INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      color TEXT,
      listing_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      condition TEXT NOT NULL CHECK(condition IN ('new','like_new','good','fair','poor')),
      category_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      campus TEXT DEFAULT 'Main Campus',
      college TEXT DEFAULT 'Campus University',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','sold','draft','flagged','removed')),
      views INTEGER DEFAULT 0,
      favorites_count INTEGER DEFAULT 0,
      ai_enhanced INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      selling_highlights TEXT DEFAULT '[]',
      is_negotiable INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (seller_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS listing_images (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL,
      url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      listing_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, listing_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      listing_id TEXT,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      last_message TEXT,
      last_message_at TEXT,
      buyer_unread INTEGER DEFAULT 0,
      seller_unread INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (seller_id) REFERENCES users(id),
      FOREIGN KEY (listing_id) REFERENCES listings(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      read_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      reviewer_id TEXT NOT NULL,
      reviewee_id TEXT NOT NULL,
      listing_id TEXT,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (reviewee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      listing_id TEXT,
      user_id TEXT,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','reviewed','resolved','dismissed')),
      admin_note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (reporter_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      query TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ai_interactions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT NOT NULL,
      input TEXT,
      output TEXT,
      model TEXT,
      tokens_used INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'completed',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (listing_id) REFERENCES listings(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (seller_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
    CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
    CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
    CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON listing_images(listing_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `);

  seedData();
}

function seedData() {
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  if (userCount > 0) return;

  const adminId = 'user-admin-001';
  const users = [
    { id: adminId, name: 'Admin User', email: 'admin@campusloop.in', password: 'admin123', college: 'Campus University', campus: 'Main Campus', bio: 'Platform administrator', is_admin: 1, avatar: null },
    { id: 'user-001', name: 'Aryan Sharma', email: 'aryan@student.in', password: 'pass123', college: 'IIT Delhi', campus: 'Hauz Khas', bio: 'Engineering student. Selling unused books & electronics.', is_admin: 0, avatar: null },
    { id: 'user-002', name: 'Priya Patel', email: 'priya@student.in', password: 'pass123', college: 'Delhi University', campus: 'North Campus', bio: 'Final year student. Love sustainable shopping.', is_admin: 0, avatar: null },
    { id: 'user-003', name: 'Rohan Mehta', email: 'rohan@student.in', password: 'pass123', college: 'BITS Pilani', campus: 'Pilani Campus', bio: 'Tech enthusiast selling gadgets.', is_admin: 0, avatar: null },
    { id: 'user-004', name: 'Sneha Iyer', email: 'sneha@student.in', password: 'pass123', college: 'NIT Trichy', campus: 'Main Campus', bio: 'Commerce student. Books and stationery seller.', is_admin: 0, avatar: null },
    { id: 'user-005', name: 'Vikram Singh', email: 'vikram@student.in', password: 'pass123', college: 'IIT Bombay', campus: 'Powai', bio: 'Mechanical eng. Selling engineering tools.', is_admin: 0, avatar: null },
    { id: 'user-006', name: 'Ananya Krishnan', email: 'ananya@student.in', password: 'pass123', college: 'NSIT Delhi', campus: 'Dwarka', bio: 'Design student. Art supplies and equipment.', is_admin: 0, avatar: null },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, college, campus, bio, is_admin, avatar, total_sold, response_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, 10);
    const sold = Math.floor(Math.random() * 20);
    const rate = 80 + Math.floor(Math.random() * 20);
    insertUser.run(u.id, u.name, u.email, hash, u.college, u.campus, u.bio, u.is_admin, u.avatar, sold, rate);
  }

  const categories = [
    { id: 'cat-001', name: 'Books', slug: 'books', icon: '📚', color: '#8B7355' },
    { id: 'cat-002', name: 'Electronics', slug: 'electronics', icon: '💻', color: '#4A6FA5' },
    { id: 'cat-003', name: 'Calculators', slug: 'calculators', icon: '🔢', color: '#5B8DB8' },
    { id: 'cat-004', name: 'Notes & Study Material', slug: 'notes', icon: '📝', color: '#6B8E23' },
    { id: 'cat-005', name: 'Furniture', slug: 'furniture', icon: '🪑', color: '#8B6914' },
    { id: 'cat-006', name: 'Clothing', slug: 'clothing', icon: '👕', color: '#7B68EE' },
    { id: 'cat-007', name: 'Bikes', slug: 'bikes', icon: '🚲', color: '#CD853F' },
    { id: 'cat-008', name: 'Sports', slug: 'sports', icon: '⚽', color: '#556B2F' },
    { id: 'cat-009', name: 'Hostel Essentials', slug: 'hostel', icon: '🏠', color: '#8B4513' },
    { id: 'cat-010', name: 'Accessories', slug: 'accessories', icon: '🎒', color: '#708090' },
    { id: 'cat-011', name: 'Other', slug: 'other', icon: '📦', color: '#A0A0A0' },
  ];

  const insertCat = db.prepare('INSERT INTO categories (id, name, slug, icon, color) VALUES (?, ?, ?, ?, ?)');
  for (const c of categories) {
    insertCat.run(c.id, c.name, c.slug, c.icon, c.color);
  }

  const listings = [
    { id: 'lst-001', title: 'Casio FX-991EX Scientific Calculator', price: 550, original_price: 900, condition: 'like_new', category_id: 'cat-003', seller_id: 'user-001', campus: 'Hauz Khas', description: 'Barely used Casio FX-991EX ClassWiz scientific calculator. Works perfectly. Battery replaced recently. Great for engineering maths.', tags: '["calculator","casio","engineering","maths"]', highlights: '["Barely used","New battery","Perfect for JEE/GATE","ClassWiz display"]' },
    { id: 'lst-002', title: 'Engineering Mathematics by R.K. Jain', price: 350, original_price: 695, condition: 'good', category_id: 'cat-001', seller_id: 'user-002', campus: 'North Campus', description: 'R.K. Jain Engineering Mathematics for B.Tech students. Some pencil notes inside, all pages intact. Very helpful for semester exams.', tags: '["maths","engineering","textbook","btech"]', highlights: '["Key formulas marked","Useful notes","Complete book","Semester ready"]' },
    { id: 'lst-003', title: 'HP Pavilion Laptop 15.6" (i5, 8GB RAM)', price: 28000, original_price: 55000, condition: 'good', category_id: 'cat-002', seller_id: 'user-003', campus: 'Pilani Campus', description: 'HP Pavilion 15, Intel i5-10th Gen, 8GB RAM, 512GB SSD, Windows 11. Excellent for coding, design, and general use. Charger included. No physical damage.', tags: '["laptop","hp","i5","windows","coding"]', highlights: '["Fast SSD","Windows 11 activated","Charger included","No scratches"] ' },
    { id: 'lst-004', title: 'Calculus: Early Transcendentals (Stewart)', price: 420, original_price: 1200, condition: 'good', category_id: 'cat-001', seller_id: 'user-001', campus: 'Hauz Khas', description: 'James Stewart Calculus 8th Edition. Some highlighted sections, comprehensive notes in margins. Perfect for BSc/BTech calculus courses.', tags: '["calculus","stewart","maths","textbook"]', highlights: '["Highlighted key sections","Margin notes included","Complete edition","IIT standard"] ' },
    { id: 'lst-005', title: 'Study Table with Drawer', price: 1800, original_price: 4500, condition: 'fair', category_id: 'cat-005', seller_id: 'user-004', campus: 'Main Campus', description: 'Solid wood study table with single drawer. Stable, no wobble. Minor surface scratches but functional. Ideal for hostel room.', tags: '["table","furniture","study","hostel","wooden"]', highlights: '["Solid wood build","Drawer for storage","Hostel-friendly size","Self-pickup only"] ' },
    { id: 'lst-006', title: 'Sony WH-1000XM4 Headphones', price: 8500, original_price: 22000, condition: 'like_new', category_id: 'cat-002', seller_id: 'user-003', campus: 'Pilani Campus', description: 'Sony noise-cancelling headphones WH-1000XM4. Used for only 3 months. Excellent audio quality. All accessories included. Upgrading to newer model.', tags: '["headphones","sony","noise-cancelling","audio","wireless"]', highlights: '["Industry-leading ANC","All accessories","Original box","3 months old"] ' },
    { id: 'lst-007', title: 'Engineering Drawing Instrument Set', price: 280, original_price: 600, condition: 'good', category_id: 'cat-010', seller_id: 'user-005', campus: 'Powai', description: 'Complete engineering drawing kit with compass, set squares, protractor, scales. Minor use marks. Perfect for first year engineering drawing course.', tags: '["drawing","engineering","compass","instruments","ED"]', highlights: '["Complete set","Minor use only","Compact carry case","First-year essential"] ' },
    { id: 'lst-008', title: 'Wireless Mouse - Logitech M235', price: 350, original_price: 999, condition: 'good', category_id: 'cat-002', seller_id: 'user-006', campus: 'Dwarka', description: 'Logitech M235 wireless mouse. Works flawlessly. USB receiver included. New batteries. Comfortable for daily use.', tags: '["mouse","logitech","wireless","laptop","accessories"]', highlights: '["Reliable connectivity","New batteries","USB receiver included","Ergonomic design"] ' },
    { id: 'lst-009', title: 'Physics Handwritten Notes (Class 12 + JEE)', price: 200, original_price: 400, condition: 'good', category_id: 'cat-004', seller_id: 'user-002', campus: 'North Campus', description: 'Complete handwritten physics notes covering Class 12 syllabus plus JEE preparation. Neat writing, diagrams included. Topics: Mechanics, Electromagnetism, Optics, Modern Physics.', tags: '["physics","notes","jee","class12","handwritten"]', highlights: '["All JEE topics covered","Clean diagrams","Formula sheets","Quick revision ready"] ' },
    { id: 'lst-010', title: 'College Backpack - F Gear Contra (35L)', price: 750, original_price: 2200, condition: 'like_new', category_id: 'cat-010', seller_id: 'user-001', campus: 'Hauz Khas', description: 'F Gear Contra backpack 35L. Barely used, no stains or tears. Multiple compartments, laptop sleeve, ergonomic straps. Deep black color.', tags: '["backpack","bag","college","laptop","carry"]', highlights: '["35L large capacity","Laptop sleeve","Barely used","Ergonomic straps"] ' },
    { id: 'lst-011', title: 'Desk LED Lamp with USB Charging Port', price: 650, original_price: 1499, condition: 'like_new', category_id: 'cat-009', seller_id: 'user-004', campus: 'Main Campus', description: 'Adjustable LED desk lamp with 3 color modes, touch dimmer, and USB port to charge phone. Hostel-friendly. Power adapter included.', tags: '["lamp","led","desk","study","hostel","light"]', highlights: '["USB charging port","3 color modes","Touch dimmer","Power adapter included"] ' },
    { id: 'lst-012', title: 'Programming in Python by Zelle', price: 480, original_price: 850, condition: 'good', category_id: 'cat-001', seller_id: 'user-003', campus: 'Pilani Campus', description: 'Python Programming book by Zelle, 2nd edition. Great for beginners and intermediate programmers. Some sticky note bookmarks inside.', tags: '["python","programming","book","coding","btech"]', highlights: '["Beginner friendly","Practical examples","Exercises included","Standard college text"] ' },
    { id: 'lst-013', title: 'Mechanical Keyboard - Redragon K552', price: 1200, original_price: 2800, condition: 'like_new', category_id: 'cat-002', seller_id: 'user-005', campus: 'Powai', description: 'Redragon K552 Mechanical Keyboard with blue switches. Compact TKL layout. RGB backlighting. Great tactile feedback for coding and typing.', tags: '["keyboard","mechanical","redragon","rgb","coding"]', highlights: '["Blue switch tactile feel","RGB backlit","Compact TKL","Excellent for coders"] ' },
    { id: 'lst-014', title: 'Chemistry NCERT Class 11 & 12 (Set)', price: 180, original_price: 380, condition: 'good', category_id: 'cat-001', seller_id: 'user-006', campus: 'Dwarka', description: 'NCERT Chemistry textbooks for Class 11 and 12. Both parts of Class 11 and both parts of Class 12 included. Used once for revision.', tags: '["chemistry","ncert","class12","class11","textbook"]', highlights: '["All 4 books in set","Minimal writing","Board exam ready","Pocket-friendly price"] ' },
    { id: 'lst-015', title: 'Cycle - Hero Sprint 26T (Mountain)', price: 3200, original_price: 8500, condition: 'fair', category_id: 'cat-007', seller_id: 'user-002', campus: 'North Campus', description: 'Hero Sprint 26T mountain cycle. Used for 2 years of campus commuting. Recently serviced, new tyres. Minor paint scratches. Handbrakes fully functional.', tags: '["cycle","bike","hero","mountain","campus","commute"]', highlights: '["Recently serviced","New tyres","Handbrakes OK","Campus commuter"] ' },
  ];

  const insertListing = db.prepare(`
    INSERT INTO listings (id, title, description, price, original_price, condition, category_id, seller_id, campus, status, tags, views, favorites_count, ai_enhanced)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, 1)
  `);

  const insertImage = db.prepare(`
    INSERT INTO listing_images (id, listing_id, url, is_primary, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  const imageMap: Record<string, string[]> = {
    'lst-001': ['https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=600'],
    'lst-002': ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600'],
    'lst-003': ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'],
    'lst-004': ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'],
    'lst-005': ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'],
    'lst-006': ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
    'lst-007': ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600'],
    'lst-008': ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600'],
    'lst-009': ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600'],
    'lst-010': ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'],
    'lst-011': ['https://images.unsplash.com/photo-1593640408182-31c228b68e10?w=600'],
    'lst-012': ['https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600'],
    'lst-013': ['https://images.unsplash.com/photo-1601370552761-1c74f4d4e9d2?w=600'],
    'lst-014': ['https://images.unsplash.com/photo-1589998059171-988d887df646?w=600'],
    'lst-015': ['https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=600'],
  };

  for (const l of listings) {
    const views = 20 + Math.floor(Math.random() * 200);
    const favs = Math.floor(Math.random() * 30);
    insertListing.run(l.id, l.title, l.description, l.price, l.original_price, l.condition, l.category_id, l.seller_id, l.campus, l.tags, views, favs);
    const imgs = imageMap[l.id] || [];
    imgs.forEach((url, i) => {
      insertImage.run(`img-${l.id}-${i}`, l.id, url, i === 0 ? 1 : 0, i);
    });
  }

  // Seed reviews
  const reviews = [
    { id: 'rev-001', reviewer_id: 'user-002', reviewee_id: 'user-001', listing_id: 'lst-001', rating: 5, comment: 'Great seller! Item exactly as described. Very quick response.' },
    { id: 'rev-002', reviewer_id: 'user-003', reviewee_id: 'user-002', listing_id: 'lst-002', rating: 4, comment: 'Good condition books, fair price. Smooth transaction.' },
    { id: 'rev-003', reviewer_id: 'user-001', reviewee_id: 'user-003', listing_id: 'lst-003', rating: 5, comment: 'Amazing laptop, just as described! Super helpful seller.' },
    { id: 'rev-004', reviewer_id: 'user-004', reviewee_id: 'user-001', listing_id: 'lst-004', rating: 4, comment: 'Calculator was in great condition. Saved a lot vs buying new.' },
    { id: 'rev-005', reviewer_id: 'user-005', reviewee_id: 'user-004', listing_id: 'lst-005', rating: 3, comment: 'Table is okay. Minor damage not mentioned but price was fair.' },
  ];

  const insertReview = db.prepare('INSERT INTO reviews (id, reviewer_id, reviewee_id, listing_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)');
  for (const r of reviews) {
    insertReview.run(r.id, r.reviewer_id, r.reviewee_id, r.listing_id, r.rating, r.comment);
  }

  // Update category listing counts
  db.exec(`
    UPDATE categories SET listing_count = (
      SELECT COUNT(*) FROM listings WHERE listings.category_id = categories.id AND listings.status = 'active'
    )
  `);

  console.log('✅ Database seeded successfully');
}
