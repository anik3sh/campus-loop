import { Router, Request, Response } from 'express';
import { db } from '../db';
import { optionalAuth, authenticateToken, AuthRequest } from '../middleware/auth';
import { assistantChat, enhanceListing, suggestPrice, smartSearch } from '../ai/marketplaceAI';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /categories
router.get('/categories', (req: Request, res: Response) => {
  const cats = db.prepare(`
    SELECT c.*, COUNT(l.id) as listing_count
    FROM categories c
    LEFT JOIN listings l ON l.category_id = c.id AND l.status = 'active'
    GROUP BY c.id
    ORDER BY c.name
  `).all();
  res.json({ categories: cats });
});

const ALL_CAMPUSES = [
  { id: 'sstc', name: 'SSTC', fullName: 'Shri Shankaracharya Technical Campus', city: 'Bhilai', location: 'Bhilai, Chhattisgarh' },
  { id: 'sspu', name: 'SSPU', fullName: 'Symbiosis Skills & Professional University', city: 'Pune', location: 'Pune, Maharashtra' },
  { id: 'iit-delhi', name: 'IIT Delhi', fullName: 'Indian Institute of Technology Delhi', city: 'New Delhi', location: 'New Delhi, Delhi' },
  { id: 'bit-durg', name: 'BIT Durg', fullName: 'Bhilai Institute of Technology Durg', city: 'Durg', location: 'Durg, Chhattisgarh' },
  { id: 'ssipmt', name: 'SSIPMT Raipur', fullName: 'Shri Shankaracharya Institute of Professional Management & Technology', city: 'Raipur', location: 'Raipur, Chhattisgarh' },
  { id: 'nit-raipur', name: 'NIT Raipur', fullName: 'National Institute of Technology Raipur', city: 'Raipur', location: 'Raipur, Chhattisgarh' },
  { id: 'iit-bombay', name: 'IIT Bombay', fullName: 'Indian Institute of Technology Bombay', city: 'Mumbai', location: 'Mumbai, Maharashtra' },
  { id: 'delhi-univ', name: 'Delhi University', fullName: 'University of Delhi', city: 'New Delhi', location: 'New Delhi, Delhi' },
];

// GET /search - Universal search for listings, users, campuses
router.get('/search', optionalAuth, (req: Request, res: Response) => {
  const { q } = req.query as any;
  if (!q || typeof q !== 'string' || !q.trim()) {
    return res.json({ listings: [], users: [], campuses: [] });
  }

  const query = q.trim();
  const term = `%${query}%`;

  // Search listings
  const listings = db.prepare(`
    SELECT l.id, l.title, l.price, l.original_price, l.condition, l.campus, l.college,
           c.name as category_name,
           (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image
    FROM listings l
    JOIN categories c ON l.category_id = c.id
    WHERE l.status = 'active' AND (
      l.title LIKE ? OR l.description LIKE ? OR l.tags LIKE ? OR l.campus LIKE ? OR l.college LIKE ?
    )
    LIMIT 6
  `).all(term, term, term, term, term);

  // Search users
  const users = db.prepare(`
    SELECT id, name, username, college, campus, location, bio, avatar, total_sold
    FROM users
    WHERE is_suspended = 0 AND (
      name LIKE ? OR username LIKE ? OR email LIKE ? OR college LIKE ? OR campus LIKE ? OR location LIKE ?
    )
    LIMIT 6
  `).all(term, term, term, term, term, term);

  // Search campuses
  const qLower = query.toLowerCase();
  const campuses = ALL_CAMPUSES.filter(c =>
    c.name.toLowerCase().includes(qLower) ||
    c.fullName.toLowerCase().includes(qLower) ||
    c.city.toLowerCase().includes(qLower) ||
    c.location.toLowerCase().includes(qLower)
  ).slice(0, 5);

  res.json({ listings, users, campuses });
});

// POST /ai/chat
router.post('/ai/chat', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const result = await assistantChat(message.trim(), Array.isArray(history) ? history : [], req.user?.id);
    res.json(result);
  } catch (err: any) {
    console.error('[AI Chat Error]:', err.message);
    res.json({
      reply: "Hi! I'm Loop AI 👋 You can find textbooks, calculators, electronics, and essentials across campuses like SSTC, IIT Delhi, BIT Durg, and SSIPMT Raipur directly in the Marketplace!",
      listings: []
    });
  }
});

// POST /ai/enhance-listing
router.post('/ai/enhance-listing', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { name, condition, description } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  try {
    const result = await enhanceListing(
      name.trim(),
      condition && typeof condition === 'string' ? condition.trim() : 'good',
      description && typeof description === 'string' ? description.trim() : '',
      req.user?.id
    );
    res.json(result);
  } catch (err: any) {
    if (err.message?.includes('GROQ_API_KEY') || err.message?.includes('not configured')) {
      return res.status(503).json({ error: 'AI service not configured', fallback: true });
    }
    console.error('[AI Enhance Error]:', err.message);
    res.status(503).json({ error: 'AI service temporarily unavailable', fallback: true });
  }
});

// POST /ai/suggest-price
router.post('/ai/suggest-price', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { title, condition, original_price } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const numOrig = original_price !== undefined ? parseFloat(original_price) : undefined;
    const result = await suggestPrice(
      title.trim(),
      condition && typeof condition === 'string' ? condition.trim() : 'good',
      isNaN(numOrig as number) ? undefined : numOrig,
      req.user?.id
    );
    res.json(result);
  } catch (err: any) {
    if (err.message?.includes('GROQ_API_KEY') || err.message?.includes('not configured')) {
      return res.status(503).json({ error: 'AI service not configured', fallback: true });
    }
    console.error('[AI Price Suggestion Error]:', err.message);
    res.status(503).json({ error: 'AI service temporarily unavailable', fallback: true });
  }
});

// GET /ai/smart-search
router.get('/ai/smart-search', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { q } = req.query as any;
  if (!q || typeof q !== 'string' || !q.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const query = q.trim();

  // Save to search history if authenticated
  if (req.user?.id) {
    try {
      db.prepare('INSERT INTO search_history (id, user_id, query) VALUES (?, ?, ?)')
        .run(uuidv4(), req.user.id, query);
    } catch {
      // non-critical
    }
  }

  try {
    const result = await smartSearch(query, req.user?.id);
    res.json(result);
  } catch (err: any) {
    console.error('[AI Smart Search Fallback]:', err.message);
    // Safe text search fallback
    const qp = `%${query}%`;
    const listings = db.prepare(`
      SELECT l.id, l.title, l.price, l.original_price, l.condition, l.campus,
             c.name as category_name, u.name as seller_name,
             (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image
      FROM listings l
      JOIN categories c ON l.category_id = c.id
      JOIN users u ON l.seller_id = u.id
      WHERE l.status = 'active' AND (l.title LIKE ? OR l.description LIKE ? OR l.tags LIKE ?)
      LIMIT 20
    `).all(qp, qp, qp);

    res.json({ listings, explanation: 'Showing keyword search results.', suggestion: 'Try adjusting your search keywords for more results.' });
  }
});

// GET /marketplace/stats
router.get('/marketplace/stats', (req: Request, res: Response) => {
  const totalItems = (db.prepare("SELECT COUNT(*) as c FROM listings WHERE status IN ('active','sold')").get() as any).c;
  const soldItems = (db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'sold'").get() as any).c;
  const totalSavedAmount = (db.prepare("SELECT COALESCE(SUM(original_price - price), 0) as v FROM listings WHERE original_price > price AND status IN ('active','sold')").get() as any).v;
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users WHERE is_suspended = 0').get() as any).c;

  res.json({ totalItems, soldItems, totalSavedAmount, userCount });
});

export default router;
