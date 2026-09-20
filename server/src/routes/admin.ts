import { Router, Response, Request } from 'express';
import { db } from '../db';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

// GET /admin/stats
router.get('/stats', (req: Request, res: Response) => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const totalListings = (db.prepare('SELECT COUNT(*) as c FROM listings').get() as any).c;
  const activeListings = (db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'active'").get() as any).c;
  const soldListings = (db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'sold'").get() as any).c;
  const flaggedListings = (db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'flagged'").get() as any).c;
  const totalMessages = (db.prepare('SELECT COUNT(*) as c FROM messages').get() as any).c;
  const pendingReports = (db.prepare("SELECT COUNT(*) as c FROM reports WHERE status = 'pending'").get() as any).c;
  const totalValue = (db.prepare("SELECT COALESCE(SUM(price), 0) as v FROM listings WHERE status = 'active'").get() as any).v;
  const totalTransactions = (db.prepare('SELECT COUNT(*) as c FROM transactions').get() as any).c;

  res.json({
    totalUsers,
    totalListings,
    activeListings,
    soldListings,
    flaggedListings,
    totalMessages,
    pendingReports,
    totalValue,
    totalTransactions
  });
});

// GET /admin/users
router.get('/users', (req: Request, res: Response) => {
  const users = db.prepare(`
    SELECT id, name, email, college, campus, is_admin, is_suspended, response_rate, total_sold, created_at,
           (SELECT COUNT(*) FROM listings WHERE seller_id = users.id) as listing_count
    FROM users ORDER BY created_at DESC LIMIT 100
  `).all();
  res.json({ users });
});

// PATCH /admin/users/:id/suspend
router.patch('/users/:id/suspend', (req: AuthRequest, res: Response) => {
  const { suspend } = req.body;
  if (req.params.id === req.user?.id) {
    return res.status(400).json({ error: 'Cannot suspend your own admin account' });
  }

  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET is_suspended = ? WHERE id = ?').run(suspend ? 1 : 0, req.params.id);
  res.json({ success: true, is_suspended: suspend ? 1 : 0 });
});

// GET /admin/listings
router.get('/listings', (req: Request, res: Response) => {
  const { status } = req.query as any;
  let where = '';
  const params: any[] = [];
  if (status) {
    where = 'WHERE l.status = ?';
    params.push(status);
  }
  const listings = db.prepare(`
    SELECT l.id, l.title, l.price, l.condition, l.status, l.views, l.created_at,
           u.name as seller_name, u.email as seller_email,
           c.name as category_name,
           (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image
    FROM listings l
    JOIN users u ON l.seller_id = u.id
    JOIN categories c ON l.category_id = c.id
    ${where}
    ORDER BY l.created_at DESC LIMIT 100
  `).all(...params);
  res.json({ listings });
});

// PATCH /admin/listings/:id
router.patch('/listings/:id', (req: Request, res: Response) => {
  const { status } = req.body;
  const validStatuses = ['active', 'sold', 'draft', 'flagged', 'removed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const listing = db.prepare('SELECT id FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  db.prepare("UPDATE listings SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  res.json({ success: true });
});

// GET /admin/reports
router.get('/reports', (req: Request, res: Response) => {
  const reports = db.prepare(`
    SELECT r.*, u.name as reporter_name, l.title as listing_title
    FROM reports r
    JOIN users u ON r.reporter_id = u.id
    LEFT JOIN listings l ON r.listing_id = l.id
    ORDER BY r.created_at DESC LIMIT 100
  `).all();
  res.json({ reports });
});

// PATCH /admin/reports/:id
router.patch('/reports/:id', (req: Request, res: Response) => {
  const { status, admin_note } = req.body;
  const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid report status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const report = db.prepare('SELECT id FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  db.prepare('UPDATE reports SET status = ?, admin_note = ? WHERE id = ?').run(status, admin_note || '', req.params.id);
  res.json({ success: true });
});

// GET /admin/categories
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

export default router;
