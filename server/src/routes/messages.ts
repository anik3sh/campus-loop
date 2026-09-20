import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /conversations - list for current user
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const convs = db.prepare(`
    SELECT conv.*, 
           l.title as listing_title, l.price as listing_price,
           (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as listing_image,
           buyer.id as buyer_id, buyer.name as buyer_name, buyer.avatar as buyer_avatar,
           seller.id as seller_id, seller.name as seller_name, seller.avatar as seller_avatar
    FROM conversations conv
    LEFT JOIN listings l ON conv.listing_id = l.id
    JOIN users buyer ON conv.buyer_id = buyer.id
    JOIN users seller ON conv.seller_id = seller.id
    WHERE conv.buyer_id = ? OR conv.seller_id = ?
    ORDER BY conv.last_message_at DESC
  `).all(userId, userId) as any[];

  const withUnread = convs.map(c => ({
    ...c,
    other_user: c.buyer_id === userId
      ? { id: c.seller_id, name: c.seller_name, avatar: c.seller_avatar }
      : { id: c.buyer_id, name: c.buyer_name, avatar: c.buyer_avatar },
    my_unread: c.buyer_id === userId ? c.buyer_unread : c.seller_unread,
    my_role: c.buyer_id === userId ? 'buyer' : 'seller',
  }));

  res.json({ conversations: withUnread });
});

// GET /conversations/:id/messages
router.get('/:id/messages', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const conv = db.prepare(`
    SELECT conv.*,
           l.title as listing_title, l.price as listing_price,
           (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as listing_image
    FROM conversations conv
    LEFT JOIN listings l ON conv.listing_id = l.id
    WHERE conv.id = ?
  `).get(req.params.id) as any;

  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.buyer_id !== userId && conv.seller_id !== userId && !req.user!.is_admin) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ?
    ORDER BY m.created_at ASC
    LIMIT 100
  `).all(req.params.id);

  // Mark as read for the current viewer
  const readField = conv.buyer_id === userId ? 'buyer_unread' : 'seller_unread';
  db.prepare(`UPDATE conversations SET ${readField} = 0 WHERE id = ?`).run(req.params.id);
  db.prepare(`
    UPDATE messages SET read_at = datetime('now') 
    WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL
  `).run(req.params.id, userId);

  res.json({ messages, conversation: conv });
});

// POST /conversations - start or get existing
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { seller_id, listing_id } = req.body;
  const buyer_id = req.user!.id;

  if (!seller_id) {
    return res.status(400).json({ error: 'seller_id is required' });
  }

  if (buyer_id === seller_id) {
    return res.status(400).json({ error: 'Cannot start conversation with yourself' });
  }

  const targetUser = db.prepare('SELECT id FROM users WHERE id = ? AND is_suspended = 0').get(seller_id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Recipient user not found or suspended' });
  }

  // Check bidirectional conversation existence for this listing
  let conv = db.prepare(`
    SELECT * FROM conversations 
    WHERE ((buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?))
      AND listing_id IS ?
  `).get(buyer_id, seller_id, seller_id, buyer_id, listing_id || null) as any;

  if (!conv) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO conversations (id, listing_id, buyer_id, seller_id, last_message_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(id, listing_id || null, buyer_id, seller_id);
    conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
  }

  res.json({ conversation: conv });
});

// POST /conversations/:id/messages
router.post('/:id/messages', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { content } = req.body;
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id) as any;
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.buyer_id !== userId && conv.seller_id !== userId && !req.user!.is_admin) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const msgId = uuidv4();
  const trimmed = content.trim();

  db.prepare(`
    INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)
  `).run(msgId, req.params.id, userId, trimmed);

  // Update conversation unread counters
  const unreadField = conv.buyer_id === userId ? 'seller_unread' : 'buyer_unread';
  db.prepare(`
    UPDATE conversations 
    SET last_message = ?, last_message_at = datetime('now'), ${unreadField} = ${unreadField} + 1
    WHERE id = ?
  `).run(trimmed.slice(0, 100), req.params.id);

  // Create notification for the recipient
  const recipientId = conv.buyer_id === userId ? conv.seller_id : conv.buyer_id;
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, body, link)
    VALUES (?, ?, 'message', 'New message', ?, ?)
  `).run(uuidv4(), recipientId, `${req.user!.name}: ${trimmed.slice(0, 60)}`, `/messages/${req.params.id}`);

  const msg = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?
  `).get(msgId);

  res.status(201).json({ message: msg });
});

export default router;
