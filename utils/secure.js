/**
 * NEON21 — Security Utilities
 * Input sanitization, rate limiting helpers, and session token validation
 */

const VALID_CARD_RANKS = new Set(['A','2','3','4','5','6','7','8','9','10','J','Q','K']);
const MAX_BET = 100000;
const MIN_BET = 1;

/**
 * Sanitize and validate a card input
 * Returns the normalized card string or throws on invalid input
 */
function validateCard(card) {
  if (card === undefined || card === null) {
    throw new Error('Card is required');
  }
  const normalized = String(card).toUpperCase().trim();
  if (!VALID_CARD_RANKS.has(normalized)) {
    throw new Error(`Invalid card: "${card}". Must be one of: ${[...VALID_CARD_RANKS].join(', ')}`);
  }
  return normalized;
}

/**
 * Sanitize a bet amount
 */
function validateBet(amount) {
  const num = Number(amount);
  if (isNaN(num) || !isFinite(num)) {
    throw new Error(`Invalid bet amount: "${amount}"`);
  }
  if (num < MIN_BET || num > MAX_BET) {
    throw new Error(`Bet must be between ${MIN_BET} and ${MAX_BET}`);
  }
  return Math.round(num * 100) / 100; // round to cents
}

/**
 * Sanitize a session ID — alphanumeric, dashes, underscores only
 */
function validateSessionId(sessionId) {
  if (!sessionId) return `anon-${Date.now()}`;
  const sanitized = String(sessionId).replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 64);
  return sanitized || `anon-${Date.now()}`;
}

/**
 * Sanitize a player total (must be integer 4–21)
 */
function validatePlayerTotal(total) {
  const num = parseInt(total);
  if (isNaN(num) || num < 4 || num > 21) {
    throw new Error(`Invalid player total: "${total}". Must be between 4 and 21`);
  }
  return num;
}

/**
 * Sanitize numDecks input
 */
function validateNumDecks(numDecks) {
  const valid = [1, 2, 4, 6, 8];
  const num = parseInt(numDecks);
  if (!valid.includes(num)) {
    throw new Error(`Invalid numDecks: "${numDecks}". Must be one of: ${valid.join(', ')}`);
  }
  return num;
}

/**
 * Simple in-memory rate limiter
 * Returns true if the request should be allowed, false if rate limited
 */
const rateLimitMap = new Map();

function checkRateLimit(key, maxRequests = 60, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
  } else {
    record.count++;
  }

  rateLimitMap.set(key, record);

  if (record.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

// Clean up stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap) {
    if (now > record.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

module.exports = {
  validateCard,
  validateBet,
  validateSessionId,
  validatePlayerTotal,
  validateNumDecks,
  checkRateLimit
};
