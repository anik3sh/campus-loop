import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /users/:id/profile
router.get('/:id/profile', (req: any, res: Response) => {
  const user = db.prepare(`
    SELECT id, name, college, campus, bio, avatar, response_rate, total_sold, created_at
    FROM users WHERE id = ? AND is_suspended = 0
  `).get(req.params.id) as any;

  if (!user) return res.status(404).json({ error: 'User not found or suspended' });

  const listings = db.prepare(`
    SELECT l.id, l.title, l.price, l.condition, l.created_at, l.status,
           c.name as category_name,
           (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image
    FROM listings l
    JOIN categories c ON l.category_id = c.id
    WHERE l.seller_id = ? AND l.status = 'active'
    ORDER BY l.created_at DESC
    LIMIT 20
  `).all(req.params.id);

  const reviews = db.prepare(`
    SELECT r.*, u.name as reviewer_name, u.avatar as reviewer_avatar
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    WHERE r.reviewee_id = ?
    ORDER BY r.created_at DESC
    LIMIT 20
  `).all(req.params.id) as any[];

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  res.json({
    user,
    listings,
    reviews,
    avg_rating: avgRating > 0 ? avgRating.toFixed(1) : '0',
    review_count: reviews.length
  });
});

// PATCH /users/me
router.patch('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const { name, bio, college, campus, phone, avatar } = req.body;

  if (name !== undefined && (!name || !name.trim())) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }

  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      bio = COALESCE(?, bio),
      college = COALESCE(?, college),
      campus = COALESCE(?, campus),
      phone = COALESCE(?, phone),
      avatar = COALESCE(?, avatar)
    WHERE id = ?
  `).run(
    name ? name.trim() : null,
    bio !== undefined ? bio : null,
    college !== undefined ? college : null,
    campus !== undefined ? campus : null,
    phone !== undefined ? phone : null,
    avatar !== undefined ? avatar : null,
    req.user!.id
  );

  const updated = db.prepare(`
    SELECT id, name, email, college, campus, bio, avatar, response_rate, total_sold, is_admin, created_at 
    FROM users WHERE id = ?
  `).get(req.user!.id);

  res.json({ user: updated });
});

// GET /users/me/favorites
router.get('/me/favorites', authenticateToken, (req: AuthRequest, res: Response) => {
  const favs = db.prepare(`
    SELECT l.id, l.title, l.price, l.condition, l.campus, l.status,
           c.name as category_name,
           (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image,
           u.name as seller_name
    FROM favorites f
    JOIN listings l ON f.listing_id = l.id
    JOIN categories c ON l.category_id = c.id
    JOIN users u ON l.seller_id = u.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.user!.id);
  res.json({ favorites: favs });
});

// GET /users/me/listings
router.get('/me/listings', authenticateToken, (req: AuthRequest, res: Response) => {
  const { status } = req.query as any;
  let where = 'WHERE l.seller_id = ?';
  const params: any[] = [req.user!.id];
  if (status) {
    where += ' AND l.status = ?';
    params.push(status);
  }
  const listings = db.prepare(`
    SELECT l.*, c.name as category_name,
           (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image,
           (SELECT COUNT(*) FROM favorites WHERE listing_id = l.id) as fav_count
    FROM listings l
    JOIN categories c ON l.category_id = c.id
    ${where}
    ORDER BY l.created_at DESC
  `).all(...params);
  res.json({ listings });
});

// GET /users/me/dashboard
router.get('/me/dashboard', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const active = (db.prepare("SELECT COUNT(*) as c FROM listings WHERE seller_id = ? AND status = 'active'").get(userId) as any).c;
  const sold = (db.prepare("SELECT COUNT(*) as c FROM listings WHERE seller_id = ? AND status = 'sold'").get(userId) as any).c;
  const drafts = (db.prepare("SELECT COUNT(*) as c FROM listings WHERE seller_id = ? AND status = 'draft'").get(userId) as any).c;
  const wishlist = (db.prepare('SELECT COUNT(*) as c FROM favorites WHERE user_id = ?').get(userId) as any).c;
  const unread = (db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN buyer_id = ? THEN buyer_unread ELSE seller_unread END), 0) as c
    FROM conversations WHERE buyer_id = ? OR seller_id = ?
  `).get(userId, userId, userId) as any).c;
  const reviews = (db.prepare("SELECT COUNT(*) as c FROM reviews WHERE reviewee_id = ?").get(userId) as any).c;
  res.json({ active, sold, drafts, wishlist, unread, reviews });
});

// GET /users/me/notifications
router.get('/me/notifications', authenticateToken, (req: AuthRequest, res: Response) => {
  const notifs = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(req.user!.id);
  const unread = (db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user!.id) as any).c;
  res.json({ notifications: notifs, unread });
});

// POST /users/me/notifications/read
router.post('/me/notifications/read', authenticateToken, (req: AuthRequest, res: Response) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.id);
  res.json({ success: true });
});

// POST /users/reviews
router.post('/reviews', authenticateToken, (req: AuthRequest, res: Response) => {
  const { reviewee_id, listing_id, rating, comment } = req.body;
  if (!reviewee_id || rating === undefined || rating === null) {
    return res.status(400).json({ error: 'reviewee_id and rating are required' });
  }

  const numRating = parseInt(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  if (reviewee_id === req.user!.id) {
    return res.status(400).json({ error: 'Cannot review yourself' });
  }

  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(reviewee_id);
  if (!target) return res.status(404).json({ error: 'Reviewee user not found' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO reviews (id, reviewer_id, reviewee_id, listing_id, rating, comment)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, reviewee_id, listing_id || null, numRating, comment ? String(comment).trim() : '');

  // Notify the reviewee
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, body, link)
    VALUES (?, ?, 'review', 'New Review Received', ?, ?)
  `).run(uuidv4(), reviewee_id, `${req.user!.name} left you a ${numRating}-star review`, `/profile/${reviewee_id}`);

  res.status(201).json({ success: true, message: 'Review submitted successfully' });
});

// GET /users/me/transactions
router.get('/me/transactions', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const transactions = db.prepare(`
    SELECT t.*,
           l.title as listing_title,
           buyer.name as buyer_name,
           seller.name as seller_name
    FROM transactions t
    JOIN listings l ON t.listing_id = l.id
    JOIN users buyer ON t.buyer_id = buyer.id
    JOIN users seller ON t.seller_id = seller.id
    WHERE t.buyer_id = ? OR t.seller_id = ?
    ORDER BY t.created_at DESC
  `).all(userId, userId);

  res.json({ transactions });
});

// POST /users/transactions - record completed transaction
router.post('/transactions', authenticateToken, (req: AuthRequest, res: Response) => {
  const { listing_id, buyer_id, amount } = req.body;
  const seller_id = req.user!.id;

  if (!listing_id || !buyer_id || amount === undefined) {
    return res.status(400).json({ error: 'listing_id, buyer_id, and amount are required' });
  }

  const listing = db.prepare('SELECT id, seller_id, price FROM listings WHERE id = ?').get(listing_id) as any;
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.seller_id !== seller_id && !req.user!.is_admin) {
    return res.status(403).json({ error: 'Only the seller can record a completed sale transaction' });
  }

  const id = uuidv4();
  const numAmount = parseFloat(amount);

  db.prepare(`
    INSERT INTO transactions (id, listing_id, buyer_id, seller_id, amount, status)
    VALUES (?, ?, ?, ?, ?, 'completed')
  `).run(id, listing_id, buyer_id, seller_id, isNaN(numAmount) ? listing.price : numAmount);

  // Mark listing as sold and increment seller count
  db.prepare("UPDATE listings SET status = 'sold', updated_at = datetime('now') WHERE id = ?").run(listing_id);
  db.prepare('UPDATE users SET total_sold = total_sold + 1 WHERE id = ?').run(seller_id);

  // Notify buyer
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, body, link)
    VALUES (?, ?, 'transaction', 'Purchase Confirmed', ?, ?)
  `).run(uuidv4(), buyer_id, `Your purchase of item was marked completed by ${req.user!.name}`, `/listing/${listing_id}`);

  res.status(201).json({ success: true, transaction_id: id });
});

export default router;
