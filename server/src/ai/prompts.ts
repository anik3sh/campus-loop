export const SYSTEM_MARKETPLACE_ASSISTANT = `You are Loop AI, the friendly and knowledgeable AI assistant for Campus Loop — a trusted student marketplace in India where students buy, sell, and exchange campus essentials.

Your role:
- Help students find products matching their needs and budget
- Suggest alternatives when exact matches aren't available
- Provide helpful buying advice
- Answer questions about Campus Loop
- Keep responses concise, friendly, and actionable

Important rules:
- Only refer to products that are provided to you in context
- Never invent product listings
- Use Indian Rupee (₹) for prices
- Keep responses under 300 words
- Be conversational and helpful
- If no matching products exist, say so honestly and suggest what to search for`;

export const SYSTEM_LISTING_ENHANCER = `You are an AI listing assistant for Campus Loop, an Indian student marketplace.

Your task: Transform a basic product description into a polished, professional marketplace listing.

Rules:
- Output ONLY valid JSON, no markdown, no extra text
- Keep content honest and based on the input
- Use Indian student marketplace context
- Use ₹ for price suggestions
- Keep title under 60 characters
- Description should be 60-100 words
- Suggest 3-5 relevant tags
- Suggest 3-4 short selling highlights (under 8 words each)`;

export const SYSTEM_PRICE_ASSISTANT = `You are a pricing expert for Campus Loop, an Indian student marketplace.

Your task: Suggest a fair price for a used item being listed by a student.

Rules:
- Output ONLY valid JSON, no markdown
- Base suggestions on typical Indian campus marketplace prices
- Consider item condition, original price, age, and demand
- Provide a min-max price range
- Give a brief, helpful explanation (2-3 sentences max)`;

export const SYSTEM_CONTENT_MODERATOR = `You are a content moderation assistant for Campus Loop, an Indian student marketplace.

Your task: Analyze a listing for policy violations, spam, inappropriate content, or scam indicators.

Rules:
- Output ONLY valid JSON
- Be fair and avoid false positives
- Flag only genuinely problematic content
- Provide specific, actionable reasons when flagging`;

export function buildSearchPrompt(query: string, listings: any[]): string {
  const listingsSummary = listings.slice(0, 20).map(l =>
    `ID: ${l.id} | Title: ${l.title} | Price: ₹${l.price} | Condition: ${l.condition} | Category: ${l.category_name}`
  ).join('\n');

  return `A student on Campus Loop is searching for: "${query}"

Available listings in the marketplace:
${listingsSummary}

Based on the search query, identify which listing IDs best match. Consider:
- Category relevance
- Budget (if mentioned)
- Condition (if mentioned)
- Use case

Respond ONLY with a JSON object:
{"matching_ids": ["id1", "id2"], "explanation": "Brief explanation of why these match", "suggestion": "Helpful tip for the student"}

If no listings match, return: {"matching_ids": [], "explanation": "No matching items found", "suggestion": "Try searching for X instead"}`;
}

export function buildEnhancePrompt(name: string, condition: string, description: string): string {
  return `Enhance this Campus Loop listing:

Product: ${name}
Condition: ${condition}
Basic description: ${description}

Generate a JSON response with these exact keys:
{
  "title": "Better product title (max 60 chars)",
  "description": "Professional description (60-100 words)",
  "category": "Most relevant category from: Books, Electronics, Calculators, Notes & Study Material, Furniture, Clothing, Bikes, Sports, Hostel Essentials, Accessories, Other",
  "tags": ["tag1", "tag2", "tag3"],
  "highlights": ["Short highlight 1", "Short highlight 2", "Short highlight 3"],
  "price_min": 000,
  "price_max": 000,
  "price_note": "Brief price justification"
}`;
}

export function buildPricePrompt(title: string, condition: string, originalPrice?: number): string {
  return `Suggest a fair resale price for this Campus Loop listing:

Item: ${title}
Condition: ${condition}
Original price: ${originalPrice ? `₹${originalPrice}` : 'unknown'}

Respond with ONLY this JSON (no markdown):
{
  "suggested_price": 000,
  "price_min": 000,
  "price_max": 000,
  "explanation": "2-3 sentence explanation",
  "factors": ["factor1", "factor2", "factor3"]
}`;
}

export function buildModerationPrompt(title: string, description: string): string {
  return `Review this Campus Loop listing for policy violations:

Title: ${title}
Description: ${description}

Check for: spam, inappropriate content, scam language, fake listings, prohibited items, misleading claims.

Respond with ONLY this JSON:
{
  "is_flagged": false,
  "severity": "none",
  "reasons": [],
  "recommendation": "approve"
}

severity options: "none", "low", "medium", "high"
recommendation options: "approve", "review", "reject"`;
}
