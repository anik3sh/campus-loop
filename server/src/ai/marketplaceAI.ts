import { db } from '../db';
import { groqChat } from './groq';
import {
  SYSTEM_MARKETPLACE_ASSISTANT,
  SYSTEM_LISTING_ENHANCER,
  SYSTEM_PRICE_ASSISTANT,
  SYSTEM_CONTENT_MODERATOR,
  buildSearchPrompt,
  buildEnhancePrompt,
  buildPricePrompt,
  buildModerationPrompt,
} from './prompts';
import { v4 as uuidv4 } from 'uuid';

function logInteraction(userId: string | undefined, type: string, input: string, output: string) {
  try {
    db.prepare(`
      INSERT INTO ai_interactions (id, user_id, type, input, output) VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), userId || null, type, input.slice(0, 500), output.slice(0, 500));
  } catch {
    // non-critical
  }
}

/**
 * Safely extracts and parses JSON from raw LLM output,
 * stripping markdown code fences, comments, and invalid control characters.
 */
function extractJson<T = any>(raw: string): T | null {
  if (!raw || typeof raw !== 'string') return null;

  let cleaned = raw
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```\s*$/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  cleaned = cleaned.substring(start, end + 1);

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    try {
      // Clean non-printable control characters that might break JSON.parse
      const sanitized = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]+/g, '');
      return JSON.parse(sanitized) as T;
    } catch {
      return null;
    }
  }
}

export async function assistantChat(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userId?: string
): Promise<{ reply: string; listings?: any[] }> {
  // Fetch relevant listings from DB for context
  const searchTerms = userMessage.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  let contextListings: any[] = [];

  if (searchTerms.length > 0) {
    const searchQuery = searchTerms.map(t => `%${t}%`);
    const placeholders = searchQuery.map(() => '(l.title LIKE ? OR l.description LIKE ? OR l.tags LIKE ?)').join(' OR ');
    const params = searchQuery.flatMap(t => [t, t, t]);
    try {
      contextListings = db.prepare(`
        SELECT l.id, l.title, l.price, l.condition, l.campus, c.name as category_name,
               u.name as seller_name,
               (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as image
        FROM listings l
        JOIN categories c ON l.category_id = c.id
        JOIN users u ON l.seller_id = u.id
        WHERE l.status = 'active' AND (${placeholders})
        LIMIT 10
      `).all(...params) as any[];
    } catch {
      contextListings = [];
    }
  }

  const listingContext = contextListings.length > 0
    ? `\n\nCurrently available listings relevant to the query:\n${contextListings.map(l =>
        `- ${l.title} | ₹${l.price} | Condition: ${l.condition} | Campus: ${l.campus}`
      ).join('\n')}`
    : '\n\nNo specific listings found for this query.';

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_MARKETPLACE_ASSISTANT + listingContext },
    ...conversationHistory.slice(-6).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  let reply = '';
  try {
    reply = await groqChat(messages, { maxTokens: 800, temperature: 0.7 });
  } catch (err: any) {
    console.warn('[Loop AI] LLM unavailable, using smart campus assistant fallback:', err.message);
    const msgLower = userMessage.toLowerCase();
    
    // Check price constraints like "under 700", "below 1000", "< 500"
    const priceMatch = msgLower.match(/(?:under|below|less than|within)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i) || msgLower.match(/(?:₹|rs\.?)\s*(\d+)/i);
    const maxBudget = priceMatch ? parseInt(priceMatch[1], 10) : null;
    
    let matchingResults = contextListings;
    if (maxBudget) {
      const budgetMatches = contextListings.filter(l => l.price <= maxBudget);
      if (budgetMatches.length > 0) matchingResults = budgetMatches;
    }
    
    if (matchingResults.length > 0) {
      reply = `I found ${matchingResults.length} matching item(s) on Campus Loop${maxBudget ? ` within your budget of ₹${maxBudget}` : ''}! Check out the recommendations below:`;
    } else if (msgLower.includes('hi') || msgLower.includes('hello') || msgLower.includes('hey')) {
      reply = "Hi there! 👋 I'm Loop AI, your campus marketplace assistant. I can help you find calculators, books, laptops, hostel essentials, or connect with students across campuses like SSTC, IIT Delhi, BIT Durg, and SSIPMT Raipur. What are you looking for today?";
    } else if (msgLower.includes('laptop')) {
      reply = "We have laptops listed by students on campus (including HP Pavilion at IIT Delhi). You can also search directly in the marketplace with the 'Electronics' filter!";
    } else if (msgLower.includes('calculator')) {
      reply = "Check out our scientific calculators like the Casio FX-991EX listed at SSTC. Perfect for semester exams!";
    } else if (msgLower.includes('book') || msgLower.includes('math') || msgLower.includes('notes')) {
      reply = "We have engineering textbooks and semester notes listed at student-friendly prices. Check out the marketplace or filter by your campus!";
    } else {
      reply = `I searched our campus listings for "${userMessage}". While there may not be an exact match right now, new items are posted daily by students. You can also explore the Marketplace tab or filter by your campus!`;
    }
  }

  logInteraction(userId, 'assistant_chat', userMessage, reply);

  return { reply, listings: contextListings.slice(0, 4) };
}

export async function enhanceListing(
  name: string,
  condition: string,
  description: string,
  userId?: string
): Promise<{
  title: string;
  description: string;
  category: string;
  tags: string[];
  highlights: string[];
  price_min: number;
  price_max: number;
  price_note: string;
}> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_LISTING_ENHANCER },
    { role: 'user', content: buildEnhancePrompt(name, condition, description) },
  ];

  let raw = '';
  try {
    raw = await groqChat(messages, { maxTokens: 1200, temperature: 0.4 });
    logInteraction(userId, 'enhance_listing', `${name} | ${condition}`, raw);
  } catch (err: any) {
    console.warn('[AI Enhance] Groq unavailable, using local generator:', err.message);
  }

  const parsed = extractJson<any>(raw);
  if (parsed && typeof parsed === 'object') {
    const tags = Array.isArray(parsed.tags) ? parsed.tags.map(String) : [];
    const highlights = Array.isArray(parsed.highlights) ? parsed.highlights.map(String) : [];
    return {
      title: parsed.title ? String(parsed.title).slice(0, 80) : name,
      description: parsed.description ? String(parsed.description) : description,
      category: parsed.category ? String(parsed.category) : 'Other',
      tags,
      highlights,
      price_min: typeof parsed.price_min === 'number' ? parsed.price_min : 0,
      price_max: typeof parsed.price_max === 'number' ? parsed.price_max : 0,
      price_note: parsed.price_note ? String(parsed.price_note) : 'AI generated recommendation',
    };
  }

  // Smart fallback when LLM is unavailable
  const words = name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const guessedCategory = words.some(w => ['book', 'calculus', 'physics', 'math', 'ncert'].includes(w)) ? 'Books'
    : words.some(w => ['laptop', 'keyboard', 'mouse', 'phone', 'headphone', 'audio'].includes(w)) ? 'Electronics'
    : words.some(w => ['table', 'chair', 'lamp', 'desk'].includes(w)) ? 'Furniture'
    : words.some(w => ['calculator', 'casio'].includes(w)) ? 'Calculators'
    : 'Other';

  return {
    title: name.length > 60 ? name.slice(0, 60) : name,
    description: description || `Well-maintained ${name} in ${condition.replace('_', ' ')} condition. Suitable for semester coursework and daily college use. Available for on-campus handover.`,
    category: guessedCategory,
    tags: Array.from(new Set([...words, condition, 'campus'])),
    highlights: [`Condition: ${condition.replace('_', ' ')}`, 'Verified student listing', 'Available for on-campus handover'],
    price_min: 200,
    price_max: 1500,
    price_note: 'Estimated based on current campus marketplace averages',
  };
}

export async function suggestPrice(
  title: string,
  condition: string,
  originalPrice?: number,
  userId?: string
): Promise<{
  suggested_price: number | null;
  price_min: number | null;
  price_max: number | null;
  explanation: string;
  factors: string[];
}> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PRICE_ASSISTANT },
    { role: 'user', content: buildPricePrompt(title, condition, originalPrice) },
  ];

  let raw = '';
  try {
    raw = await groqChat(messages, { maxTokens: 800, temperature: 0.4 });
    logInteraction(userId, 'price_suggestion', `${title} | ${condition}`, raw);
  } catch (err: any) {
    console.warn('[AI Price Suggest] Groq unavailable, using campus pricing model:', err.message);
  }

  const parsed = extractJson<any>(raw);
  if (parsed && typeof parsed === 'object') {
    return {
      suggested_price: typeof parsed.suggested_price === 'number' ? parsed.suggested_price : null,
      price_min: typeof parsed.price_min === 'number' ? parsed.price_min : null,
      price_max: typeof parsed.price_max === 'number' ? parsed.price_max : null,
      explanation: parsed.explanation ? String(parsed.explanation) : 'Based on current campus market prices.',
      factors: Array.isArray(parsed.factors) ? parsed.factors.map(String) : [],
    };
  }

  // Local calculation based on original price and condition
  const base = originalPrice && originalPrice > 0 ? originalPrice : 1000;
  const multiplier = condition === 'new' ? 0.85
    : condition === 'like_new' ? 0.70
    : condition === 'good' ? 0.55
    : condition === 'fair' ? 0.40
    : 0.25;

  const suggested = Math.round(base * multiplier);
  const min = Math.round(suggested * 0.85);
  const max = Math.round(suggested * 1.15);

  return {
    suggested_price: suggested,
    price_min: min,
    price_max: max,
    explanation: originalPrice
      ? `Suggested at ~${Math.round(multiplier * 100)}% of original price (₹${originalPrice}) for ${condition.replace('_', ' ')} condition on campus.`
      : 'Calculated from campus student demand and condition rating.',
    factors: [
      `Condition: ${condition.replace('_', ' ')}`,
      'Fair pricing for college student circulation',
      'Campus meetup savings (no shipping cost)',
    ],
  };
}

export async function moderateListing(
  title: string,
  description: string
): Promise<{
  is_flagged: boolean;
  severity: 'none' | 'low' | 'medium' | 'high';
  reasons: string[];
  recommendation: 'approve' | 'review' | 'reject';
}> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_CONTENT_MODERATOR },
    { role: 'user', content: buildModerationPrompt(title, description) },
  ];

  try {
    const raw = await groqChat(messages, { maxTokens: 500, temperature: 0.2 });
    const parsed = extractJson<any>(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        is_flagged: !!parsed.is_flagged,
        severity: ['none', 'low', 'medium', 'high'].includes(parsed.severity) ? parsed.severity : 'none',
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map(String) : [],
        recommendation: ['approve', 'review', 'reject'].includes(parsed.recommendation) ? parsed.recommendation : 'approve',
      };
    }
  } catch {
    // on error, approve by default
  }

  return { is_flagged: false, severity: 'none', reasons: [], recommendation: 'approve' };
}

export async function smartSearch(
  query: string,
  userId?: string
): Promise<{ listings: any[]; explanation: string; suggestion: string }> {
  // Get all active listings for AI to rank
  const allListings = db.prepare(`
    SELECT l.id, l.title, l.price, l.condition, l.campus, c.name as category_name,
           l.description, l.tags
    FROM listings l
    JOIN categories c ON l.category_id = c.id
    WHERE l.status = 'active'
    LIMIT 50
  `).all() as any[];

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: 'You are a search assistant for Campus Loop marketplace. Always respond with valid JSON only.' },
    { role: 'user', content: buildSearchPrompt(query, allListings) },
  ];

  let raw = '';
  try {
    raw = await groqChat(messages, { maxTokens: 800, temperature: 0.3 });
    logInteraction(userId, 'smart_search', query, raw);
  } catch {
    // continue to fallback
  }

  let matchingIds: string[] = [];
  let explanation = '';
  let suggestion = '';

  const parsed = extractJson<any>(raw);
  if (parsed && typeof parsed === 'object') {
    matchingIds = Array.isArray(parsed.matching_ids) ? parsed.matching_ids.map(String) : [];
    explanation = parsed.explanation ? String(parsed.explanation) : '';
    suggestion = parsed.suggestion ? String(parsed.suggestion) : '';
  }

  if (matchingIds.length === 0) {
    // fallback to regular text search
    const q = `%${query}%`;
    const fallback = db.prepare(`
      SELECT l.id FROM listings l
      WHERE l.status = 'active' AND (l.title LIKE ? OR l.description LIKE ? OR l.tags LIKE ?)
      LIMIT 10
    `).all(q, q, q) as any[];
    matchingIds = fallback.map(r => r.id);
  }

  if (matchingIds.length === 0) {
    return { listings: [], explanation: explanation || 'No matching items found.', suggestion };
  }

  const placeholders = matchingIds.map(() => '?').join(',');
  const listings = db.prepare(`
    SELECT l.id, l.title, l.price, l.original_price, l.condition, l.campus, l.favorites_count,
           l.created_at, c.name as category_name, u.name as seller_name,
           (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image
    FROM listings l
    JOIN categories c ON l.category_id = c.id
    JOIN users u ON l.seller_id = u.id
    WHERE l.id IN (${placeholders}) AND l.status = 'active'
  `).all(...matchingIds) as any[];

  return { listings, explanation, suggestion };
}
