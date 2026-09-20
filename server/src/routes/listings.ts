import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { moderateListing } from '../ai/marketplaceAI';

const router = Router();

// Multer config
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    if (allowed.test(ext) || allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
    }
  },
});

function normalizeJsonArray(input: any): string {
  if (!input) return '[]';
  if (Array.isArray(input)) return JSON.stringify(input);
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return '[]';
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return JSON.stringify(parsed);
      return JSON.stringify([parsed]);
    } catch {
      const items = trimmed
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      return JSON.stringify(items);
    }
  }
  return '[]';
}

// GET /listings - public
router.get('/', optionalAuth, (req: AuthRequest, res: Response) => {
  const {
    q, category, condition, campus, min_price, max_price,
    sort = 'newest', page = '1', limit = '20', status = 'active',
  } = req.query as any;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const where = ['l.status = ?'];
  const params: any[] = [status || 'active'];

  if (q && typeof q === 'string' && q.trim()) {
    where.push('(l.title LIKE ? OR l.description LIKE ? OR l.tags LIKE ?)');
    const qp = `%${q.trim()}%`;
    params.push(qp, qp, qp);
  }
  if (category) {
    where.push('c.slug = ?');
    params.push(category);
  }
  if (condition) {
    where.push('l.condition = ?');
    params.push(condition);
  }
  if (campus) {
    where.push('l.campus LIKE ?');
    params.push(`%${campus}%`);
  }
  if (min_price) {
    const minVal = parseFloat(min_price);
    if (!isNaN(minVal)) {
      where.push('l.price >= ?');
      params.push(minVal);
    }
  }
  if (max_price) {
    const maxVal = parseFloat(max_price);
    if (!isNaN(maxVal)) {
      where.push('l.price <= ?');
      params.push(maxVal);
    }
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  let orderClause = 'ORDER BY l.created_at DESC';
  if (sort === 'price_asc') orderClause = 'ORDER BY l.price ASC';
  else if (sort === 'price_desc') orderClause = 'ORDER BY l.price DESC';
  else if (sort === 'popular') orderClause = 'ORDER BY l.views DESC, l.favorites_count DESC';

  const listings = db.prepare(`
    SELECT l.id, l.title, l.price, l.original_price, l.condition, l.campus, l.college,
           l.status, l.views, l.favorites_count, l.created_at, l.is_negotiable,
           c.name as category_name, c.slug as category_slug,
           u.id as seller_id, u.name as seller_name, u.avatar as seller_avatar,
           (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image
    FROM listings l
    JOIN categories c ON l.category_id = c.id
    JOIN users u ON l.seller_id = u.id
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset) as any[];

  const totalResult = db.prepare(`
    SELECT COUNT(*) as total FROM listings l
    JOIN categories c ON l.category_id = c.id
    ${whereClause}
  `).get(...params) as any;

  const userId = req.user?.id;
  let favoriteIds: Set<string> = new Set();
  if (userId) {
    const favs = db.prepare('SELECT listing_id FROM favorites WHERE user_id = ?').all(userId) as any[];
    favoriteIds = new Set(favs.map((f: any) => f.listing_id));
  }

  const withFav = listings.map(l => ({
    ...l,
    is_favorited: favoriteIds.has(l.id),
  }));

  const total = totalResult?.total || 0;
  res.json({
    listings: withFav,
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum) || 1,
  });
});

// GET /listings/:id
router.get('/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  const listing = db.prepare(`
    SELECT l.*, c.name as category_name, c.slug as category_slug,
           u.id as seller_id, u.name as seller_name, u.avatar as seller_avatar,
           u.college as seller_college, u.campus as seller_campus,
           u.response_rate, u.total_sold,
           (SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id) as seller_rating,
           (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) as seller_review_count
    FROM listings l
    JOIN categories c ON l.category_id = c.id
    JOIN users u ON l.seller_id = u.id
    WHERE l.id = ?
  `).get(req.params.id) as any;

  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  // Increment views
  db.prepare('UPDATE listings SET views = views + 1 WHERE id = ?').run(req.params.id);

  // Guarantee valid JSON array strings
  listing.tags = normalizeJsonArray(listing.tags);
  listing.selling_highlights = normalizeJsonArray(listing.selling_highlights);

  const images = db.prepare('SELECT * FROM listing_images WHERE listing_id = ? ORDER BY sort_order').all(req.params.id);

  let is_favorited = false;
  if (req.user) {
    const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?').get(req.user.id, req.params.id);
    is_favorited = !!fav;
  }

  // Similar listings in same category
  const similar = db.prepare(`
    SELECT l.id, l.title, l.price, l.condition,
           (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image
    FROM listings l
    WHERE l.category_id = ? AND l.id != ? AND l.status = 'active'
    LIMIT 4
  `).all(listing.category_id, req.params.id);

  res.json({ listing: { ...listing, images, is_favorited }, similar });
});

// POST /listings - create
router.post('/', authenticateToken, upload.array('images', 8), async (req: AuthRequest, res: Response) => {
  const {
    title, description, price, original_price, condition,
    category_id, campus, is_negotiable, tags, selling_highlights
  } = req.body;

  if (!title || price === undefined || price === null || !condition || !category_id) {
    return res.status(400).json({ error: 'Title, price, condition, and category are required' });
  }

  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice < 0) {
    return res.status(400).json({ error: 'Price must be a valid non-negative number' });
  }

  const validConditions = ['new', 'like_new', 'good', 'fair', 'poor'];
  if (!validConditions.includes(condition)) {
    return res.status(400).json({ error: `Condition must be one of: ${validConditions.join(', ')}` });
  }

  // Check category exists
  const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
  if (!cat) return res.status(400).json({ error: 'Invalid category ID' });

  // Run AI moderation
  let moderationResult: any = { is_flagged: false, recommendation: 'approve' };
  try {
    moderationResult = await moderateListing(title, description || '');
  } catch {
    // continue without moderation if AI unavailable
  }

  const id = uuidv4();
  const status = moderationResult.is_flagged && moderationResult.recommendation === 'reject' ? 'flagged' : 'active';
  const resolvedCampus = campus && campus.trim() ? campus.trim() : (req.user?.campus || 'Main Campus');
  const resolvedCollege = req.user?.college || 'Campus University';
  const normalizedTags = normalizeJsonArray(tags);
  const normalizedHighlights = normalizeJsonArray(selling_highlights);

  db.prepare(`
    INSERT INTO listings (
      id, title, description, price, original_price, condition,
      category_id, seller_id, campus, college, is_negotiable,
      tags, selling_highlights, status, ai_enhanced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    title.trim(),
    description ? description.trim() : '',
    numPrice,
    original_price ? parseFloat(original_price) : null,
    condition,
    category_id,
    req.user!.id,
    resolvedCampus,
    resolvedCollege,
    is_negotiable === 'true' || is_negotiable === true ? 1 : 0,
    normalizedTags,
    normalizedHighlights,
    status,
    0
  );

  // Handle uploaded images
  const files = req.files as Express.Multer.File[];
  if (files && files.length > 0) {
    const insertImg = db.prepare('INSERT INTO listing_images (id, listing_id, url, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)');
    files.forEach((file, i) => {
      insertImg.run(uuidv4(), id, `/uploads/${file.filename}`, i === 0 ? 1 : 0, i);
    });
  }

  // Update category listing count
  db.prepare(`UPDATE categories SET listing_count = listing_count + 1 WHERE id = ?`).run(category_id);

  const created = db.prepare('SELECT * FROM listings WHERE id = ?').get(id) as any;
  if (created) {
    created.tags = normalizeJsonArray(created.tags);
    created.selling_highlights = normalizeJsonArray(created.selling_highlights);
  }

  res.status(201).json({ listing: created, moderation: moderationResult });
});

// PATCH /listings/:id
router.patch('/:id', authenticateToken, upload.array('images', 8), (req: AuthRequest, res: Response) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id) as any;
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.seller_id !== req.user!.id && !req.user!.is_admin) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const {
    title, description, price, original_price, condition,
    category_id, campus, status, is_negotiable, tags, selling_highlights
  } = req.body;

  // Track sold transition to increment user total_sold
  const targetStatus = status || listing.status;
  if (targetStatus === 'sold' && listing.status !== 'sold') {
    db.prepare('UPDATE users SET total_sold = total_sold + 1 WHERE id = ?').run(listing.seller_id);
  }

  const updatedTags = tags !== undefined ? normalizeJsonArray(tags) : listing.tags;
  const updatedHighlights = selling_highlights !== undefined ? normalizeJsonArray(selling_highlights) : listing.selling_highlights;

  let parsedPrice = null;
  if (price !== undefined && price !== null) {
    const p = parseFloat(price);
    if (!isNaN(p)) parsedPrice = p;
  }

  let parsedOriginalPrice = null;
  if (original_price !== undefined && original_price !== null) {
    const op = parseFloat(original_price);
    if (!isNaN(op)) parsedOriginalPrice = op;
  }

  db.prepare(`
    UPDATE listings SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      original_price = COALESCE(?, original_price),
      condition = COALESCE(?, condition),
      category_id = COALESCE(?, category_id),
      campus = COALESCE(?, campus),
      status = COALESCE(?, status),
      is_negotiable = COALESCE(?, is_negotiable),
      tags = ?,
      selling_highlights = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || null,
    description !== undefined ? description : null,
    parsedPrice,
    parsedOriginalPrice,
    condition || null,
    category_id || null,
    campus || null,
    status || null,
    is_negotiable !== undefined ? (is_negotiable === 'true' || is_negotiable === true ? 1 : 0) : null,
    updatedTags,
    updatedHighlights,
    req.params.id
  );

  // Handle newly uploaded images if provided
  const files = req.files as Express.Multer.File[];
  if (files && files.length > 0) {
    const existingCount = (db.prepare('SELECT COUNT(*) as c FROM listing_images WHERE listing_id = ?').get(req.params.id) as any).c;
    const insertImg = db.prepare('INSERT INTO listing_images (id, listing_id, url, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)');
    files.forEach((file, i) => {
      const isPrimary = existingCount === 0 && i === 0 ? 1 : 0;
      insertImg.run(uuidv4(), req.params.id, `/uploads/${file.filename}`, isPrimary, existingCount + i);
    });
  }

  const updated = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id) as any;
  if (updated) {
    updated.tags = normalizeJsonArray(updated.tags);
    updated.selling_highlights = normalizeJsonArray(updated.selling_highlights);
  }

  res.json({ success: true, listing: updated });
});

// DELETE /listings/:id
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id) as any;
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.seller_id !== req.user!.id && !req.user!.is_admin) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  db.prepare("UPDATE listings SET status = 'removed', updated_at = datetime('now') WHERE id = ?").run(req.params.id);

  // Decrement category listing_count if it was active
  if (listing.status === 'active') {
    db.prepare('UPDATE categories SET listing_count = MAX(0, listing_count - 1) WHERE id = ?').run(listing.category_id);
  }

  res.json({ success: true, message: 'Listing removed successfully' });
});

// POST /listings/:id/favorite
router.post('/:id/favorite', authenticateToken, (req: AuthRequest, res: Response) => {
  const listing = db.prepare('SELECT id FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?').get(req.user!.id, req.params.id);
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?').run(req.user!.id, req.params.id);
    db.prepare('UPDATE listings SET favorites_count = MAX(0, favorites_count - 1) WHERE id = ?').run(req.params.id);
    res.json({ favorited: false });
  } else {
    db.prepare('INSERT INTO favorites (id, user_id, listing_id) VALUES (?, ?, ?)').run(uuidv4(), req.user!.id, req.params.id);
    db.prepare('UPDATE listings SET favorites_count = favorites_count + 1 WHERE id = ?').run(req.params.id);
    res.json({ favorited: true });
  }
});

// POST /listings/:id/report
router.post('/:id/report', authenticateToken, (req: AuthRequest, res: Response) => {
  const { reason, description } = req.body;
  if (!reason || !reason.trim()) return res.status(400).json({ error: 'Reason is required' });

  const listing = db.prepare('SELECT id FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  db.prepare('INSERT INTO reports (id, reporter_id, listing_id, reason, description) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), req.user!.id, req.params.id, reason.trim(), description ? description.trim() : '');

  res.json({ success: true, message: 'Report submitted successfully' });
});

export default router;
