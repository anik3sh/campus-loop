import http from 'http';
import app from '../index';
import { db } from '../db';

let server: http.Server;
let BASE_URL = 'http://localhost:5001';

async function request(path: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
} = {}) {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const init: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    if (typeof options.body === 'string') {
      init.body = options.body;
    } else {
      init.body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(url, init);
  let data: any = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('🧪 Starting Campus Loop Backend Automated Test Suite');
  console.log('==================================================\n');

  // Start temporary test server on port 5001
  const TEST_PORT = 5001;
  BASE_URL = `http://localhost:${TEST_PORT}`;
  server = app.listen(TEST_PORT);

  try {
    // 1. HEALTH CHECK
    console.log('--- 1. Health Check ---');
    const health = await request('/api/health');
    assert(health.status === 200, 'Health check returns 200 OK');
    assert(health.data.status === 'ok', 'Health response status is "ok"');
    assert(!!health.data.groq_model, 'Health reports groq_model');

    // 2. AUTHENTICATION & SECURITY
    console.log('\n--- 2. Authentication & Security ---');
    const testEmail = `tester_${Date.now()}@campus.edu`;
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test Student',
        email: testEmail,
        password: 'password123',
        college: 'Test College',
        campus: 'North Campus',
      },
    });
    assert(regRes.status === 201, 'User registration returns 201 Created');
    assert(!!regRes.data.token, 'Registration returns JWT token');
    assert(regRes.data.user?.is_admin === false, 'New user is_admin is boolean false');

    const testToken = regRes.data.token;
    const testUserId = regRes.data.user.id;

    // Duplicate registration should fail
    const dupRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Duplicate',
        email: testEmail,
        password: 'password123',
      },
    });
    assert(dupRes.status === 409, 'Duplicate email registration rejected with 409 Conflict');

    // Password length validation
    const shortPassRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Short Pass',
        email: `short_${Date.now()}@test.com`,
        password: '123',
      },
    });
    assert(shortPassRes.status === 400, 'Short password rejected with 400 Bad Request');

    // Invalid email validation
    const badEmailRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Bad Email',
        email: 'notanemail',
        password: 'password123',
      },
    });
    assert(badEmailRes.status === 400, 'Malformed email rejected with 400 Bad Request');

    // Login with valid credentials
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'password123' },
    });
    assert(loginRes.status === 200, 'Login with valid credentials returns 200');
    assert(!!loginRes.data.token, 'Login returns valid token');

    // Login with invalid credentials
    const badLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'wrongpassword' },
    });
    assert(badLoginRes.status === 401, 'Invalid password returns 401 Unauthorized');

    // Authenticated me check
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    assert(meRes.status === 200, 'GET /api/auth/me with valid token returns 200');
    assert(meRes.data.user?.id === testUserId, 'GET /api/auth/me matches registered user id');

    // Admin login with seeded credentials
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@campusloop.in', password: 'admin123' },
    });
    assert(adminLogin.status === 200, 'Admin login with seeded credentials returns 200');
    assert(adminLogin.data.user?.is_admin === true, 'Admin user has is_admin boolean true');
    const adminToken = adminLogin.data.token;

    // 3. CATEGORIES
    console.log('\n--- 3. Categories ---');
    const catRes = await request('/api/categories');
    assert(catRes.status === 200, 'GET /api/categories returns 200');
    assert(Array.isArray(catRes.data.categories), 'Categories is an array');
    assert(catRes.data.categories.length > 0, 'Categories list is populated');
    const firstCatId = catRes.data.categories[0].id;

    // 4. LISTINGS CRUD & JSON PARSING INTEGRITY
    console.log('\n--- 4. Listings CRUD & Safe JSON Handling ---');
    // Create listing with comma-separated tags and string highlights
    const createListingRes = await request('/api/listings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: {
        title: 'Complete Edition Physics Notes',
        description: 'Comprehensive handwritten formulas and diagrams.',
        price: 250,
        original_price: 500,
        condition: 'good',
        category_id: firstCatId,
        campus: 'South Campus',
        tags: 'physics, notes, jee, formulas', // comma-separated string test!
        selling_highlights: '["Clean handwriting", "Formulas marked"]',
        is_negotiable: true,
      },
    });
    assert(createListingRes.status === 201, 'Create listing returns 201 Created');
    assert(!!createListingRes.data.listing?.id, 'Created listing contains id');
    const newListingId = createListingRes.data.listing.id;

    // Verify GET /api/listings/:id does not crash when parsing tags/highlights
    const detailRes = await request(`/api/listings/${newListingId}`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    assert(detailRes.status === 200, 'GET /api/listings/:id returns 200');
    let parsedTags: any[] = [];
    try {
      parsedTags = JSON.parse(detailRes.data.listing.tags);
    } catch {
      parsedTags = [];
    }
    assert(Array.isArray(parsedTags) && parsedTags.length > 0, 'Tags successfully normalized to valid JSON array string');
    assert(detailRes.data.listing.campus === 'South Campus', 'Listing campus preserved without seller name collision');

    // List listings with query and pagination
    const listRes = await request('/api/listings?q=Physics&page=1&limit=5');
    assert(listRes.status === 200, 'GET /api/listings with search query returns 200');
    assert(Array.isArray(listRes.data.listings), 'Listings result contains listings array');
    assert(listRes.data.total >= 1, 'Search query found matching listings');

    // PATCH listing
    const patchRes = await request(`/api/listings/${newListingId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${testToken}` },
      body: {
        price: 200,
        is_negotiable: false,
        tags: 'physics, revised, notes',
      },
    });
    assert(patchRes.status === 200, 'PATCH /api/listings/:id returns 200');
    assert(patchRes.data.listing?.price === 200, 'Price updated successfully');

    // Toggle favorite
    const favRes1 = await request(`/api/listings/${newListingId}/favorite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
    });
    assert(favRes1.status === 200 && favRes1.data.favorited === true, 'Favoriting listing sets favorited: true');

    const favRes2 = await request(`/api/listings/${newListingId}/favorite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
    });
    assert(favRes2.status === 200 && favRes2.data.favorited === false, 'Unfavoriting listing toggles to false');

    // Report listing
    const reportRes = await request(`/api/listings/${newListingId}/report`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: { reason: 'spam', description: 'Testing report functionality' },
    });
    assert(reportRes.status === 200, 'Report listing returns 200');

    // 5. MESSAGING & CONVERSATIONS
    console.log('\n--- 5. Messaging & Bidirectional Conversations ---');
    // Start conversation between test student and seeded user (user-001)
    const convRes1 = await request('/api/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: { seller_id: 'user-001', listing_id: 'lst-001' },
    });
    assert(convRes1.status === 200, 'Start conversation returns 200');
    const convId = convRes1.data.conversation?.id;
    assert(!!convId, 'Conversation ID returned');

    // Start conversation again from opposite or same user: must NOT duplicate
    const convRes2 = await request('/api/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: { seller_id: 'user-001', listing_id: 'lst-001' },
    });
    assert(convRes2.data.conversation?.id === convId, 'Re-initiating chat reuses existing conversation without duplicate');

    // Send a message
    const sendMsgRes = await request(`/api/messages/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: { content: 'Hello! Is this calculator still available?' },
    });
    assert(sendMsgRes.status === 201, 'Send message returns 201 Created');
    assert(sendMsgRes.data.message?.content === 'Hello! Is this calculator still available?', 'Message content stored accurately');

    // Get messages
    const getMsgsRes = await request(`/api/messages/${convId}/messages`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    assert(getMsgsRes.status === 200, 'Get messages returns 200');
    assert(getMsgsRes.data.messages?.length > 0, 'Messages list is non-empty');

    // 6. USER PROFILE, DASHBOARD, REVIEWS & TRANSACTIONS
    console.log('\n--- 6. User Profile, Dashboard & Transactions ---');
    const profileRes = await request(`/api/users/${testUserId}/profile`);
    assert(profileRes.status === 200, 'GET /api/users/:id/profile returns 200');
    assert(profileRes.data.user?.name === 'Test Student', 'Profile returns correct name');

    // Update profile
    const updateMeRes = await request('/api/users/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${testToken}` },
      body: { bio: 'Engineering sophomore studying at Campus University.', phone: '9876543210' },
    });
    assert(updateMeRes.status === 200, 'PATCH /api/users/me returns 200');
    assert(updateMeRes.data.user?.bio?.includes('Engineering sophomore'), 'Bio updated correctly');

    // Dashboard stats
    const dashRes = await request('/api/users/me/dashboard', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    assert(dashRes.status === 200, 'GET /api/users/me/dashboard returns 200');
    assert(typeof dashRes.data.active === 'number', 'Dashboard returns active count');

    // Submit review for another user
    const reviewRes = await request('/api/users/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: { reviewee_id: 'user-001', rating: 5, comment: 'Great seller and prompt response!' },
    });
    assert(reviewRes.status === 201, 'Submit review returns 201 Created');

    // Transactions: Record purchase
    const transRes = await request('/api/users/transactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: { listing_id: newListingId, buyer_id: 'user-002', amount: 200 },
    });
    assert(transRes.status === 201, 'Record transaction returns 201 Created');

    // 7. MARKETPLACE STATS
    console.log('\n--- 7. Marketplace Stats ---');
    const statsRes = await request('/api/marketplace/stats');
    assert(statsRes.status === 200, 'GET /api/marketplace/stats returns 200');
    assert(typeof statsRes.data.totalItems === 'number', 'Marketplace stats totalItems is numeric');
    assert(typeof statsRes.data.soldItems === 'number', 'Marketplace stats soldItems is numeric');

    // 8. ADMIN DASHBOARD & CONTROLS
    console.log('\n--- 8. Admin Controls ---');
    // Non-admin forbidden
    const nonAdminStats = await request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    assert(nonAdminStats.status === 403, 'Non-admin blocked from /api/admin/stats with 403 Forbidden');

    // Admin allowed
    const adminStats = await request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminStats.status === 200, 'Admin accesses /api/admin/stats with 200');
    assert(adminStats.data.totalUsers >= 1, 'Admin stats report totalUsers');

    // Admin suspend user
    const suspendRes = await request(`/api/admin/users/${testUserId}/suspend`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { suspend: true },
    });
    assert(suspendRes.status === 200 && suspendRes.data.is_suspended === 1, 'Admin can suspend user');

    // Suspended user cannot login
    const suspendedLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'password123' },
    });
    assert(suspendedLogin.status === 403, 'Suspended user blocked at login with 403');

    // Admin unsuspend user
    const unsuspendRes = await request(`/api/admin/users/${testUserId}/suspend`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { suspend: false },
    });
    assert(unsuspendRes.status === 200 && unsuspendRes.data.is_suspended === 0, 'Admin can unsuspend user');

    // 9. GROQ AI FEATURES
    console.log('\n--- 9. Groq AI Capabilities ---');
    // AI Chat
    try {
      const aiChatRes = await request('/api/ai/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${testToken}` },
        body: { message: 'Do you have any engineering calculators?' },
      });
      assert(aiChatRes.status === 200, 'POST /api/ai/chat returns 200');
      assert(typeof aiChatRes.data.reply === 'string' && aiChatRes.data.reply.length > 0, 'AI Chat returns non-empty reply');
    } catch (e: any) {
      console.warn('AI chat error:', e.message);
    }

    // AI Listing Enhancer
    try {
      const aiEnhanceRes = await request('/api/ai/enhance-listing', {
        method: 'POST',
        headers: { Authorization: `Bearer ${testToken}` },
        body: { name: 'Casio FX-991EX', condition: 'like_new', description: 'Used for one semester' },
      });
      assert(aiEnhanceRes.status === 200, 'POST /api/ai/enhance-listing returns 200');
      assert(typeof aiEnhanceRes.data.title === 'string', 'AI Enhancer returns title');
      assert(Array.isArray(aiEnhanceRes.data.tags), 'AI Enhancer returns tags array');
      assert(Array.isArray(aiEnhanceRes.data.highlights), 'AI Enhancer returns highlights array');
    } catch (e: any) {
      console.warn('AI enhance error:', e.message);
    }

    // AI Price Suggestion
    try {
      const aiPriceRes = await request('/api/ai/suggest-price', {
        method: 'POST',
        headers: { Authorization: `Bearer ${testToken}` },
        body: { title: 'Engineering Mathematics by R.K. Jain', condition: 'good', original_price: 695 },
      });
      assert(aiPriceRes.status === 200, 'POST /api/ai/suggest-price returns 200');
      assert(typeof aiPriceRes.data.explanation === 'string', 'Price suggestion returns explanation');
    } catch (e: any) {
      console.warn('AI price error:', e.message);
    }

    // AI Smart Search
    try {
      const aiSearchRes = await request('/api/ai/smart-search?q=calculator');
      assert(aiSearchRes.status === 200, 'GET /api/ai/smart-search returns 200');
      assert(Array.isArray(aiSearchRes.data.listings), 'Smart search returns listings array');
    } catch (e: any) {
      console.warn('AI search error:', e.message);
    }

    // 10. ERROR HANDLING & 404
    console.log('\n--- 10. Error Handling & 404 Handlers ---');
    const notFoundRes = await request('/api/nonexistent_route');
    assert(notFoundRes.status === 404, 'Unknown /api/* route returns JSON 404');
    assert(typeof notFoundRes.data.error === 'string', '404 returns formatted error message');

    console.log('\n==================================================');
    console.log(`📊 Test Results: ${passedTests} Passed, ${failedTests} Failed`);
    console.log('==================================================\n');

  } catch (err: any) {
    console.error('Fatal test error:', err);
  } finally {
    server.close();
    // Clean up test user & listing from DB
    try {
      db.prepare("DELETE FROM users WHERE email LIKE 'tester_%'").run();
      db.prepare("DELETE FROM listings WHERE title = 'Complete Edition Physics Notes'").run();
    } catch {}
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runTests();
