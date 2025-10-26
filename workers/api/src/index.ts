/**
 * Dhwani API Worker
 * Handles related works and other dynamic API endpoints
 */

export interface Env {
  CACHE: KVNamespace;
  RATE_LIMITER?: KVNamespace;
}

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS: 100, // per window
  WINDOW_MS: 60000, // 1 minute
};

interface WorkMetadata {
  slug: string;
  title: string;
  author: string[];
  genre: string[];
  collections: string[];
  language: string[];
}

interface RelatedWork {
  slug: string;
  title: string;
  author: string[];
  reason: string;
  score: number;
}

// CORS headers - restrict to production domain
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://dhwani.in',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Development CORS headers for local testing
const CORS_HEADERS_DEV = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Check rate limit for IP address
 */
async function checkRateLimit(
  request: Request,
  env: Env
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  // Get client IP from CF headers
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `ratelimit:${ip}`;
  const now = Date.now();

  try {
    // Get current request count from KV
    const data = await env.CACHE.get(key, 'json') as { count: number; windowStart: number } | null;

    if (!data || now - data.windowStart > RATE_LIMIT.WINDOW_MS) {
      // New window
      await env.CACHE.put(
        key,
        JSON.stringify({ count: 1, windowStart: now }),
        { expirationTtl: 120 }
      );
      return {
        allowed: true,
        remaining: RATE_LIMIT.MAX_REQUESTS - 1,
        reset: now + RATE_LIMIT.WINDOW_MS,
      };
    }

    // Within existing window
    if (data.count >= RATE_LIMIT.MAX_REQUESTS) {
      return {
        allowed: false,
        remaining: 0,
        reset: data.windowStart + RATE_LIMIT.WINDOW_MS,
      };
    }

    // Increment counter
    await env.CACHE.put(
      key,
      JSON.stringify({ count: data.count + 1, windowStart: data.windowStart }),
      { expirationTtl: 120 }
    );

    return {
      allowed: true,
      remaining: RATE_LIMIT.MAX_REQUESTS - data.count - 1,
      reset: data.windowStart + RATE_LIMIT.WINDOW_MS,
    };
  } catch (error) {
    // If rate limiting fails, allow the request (fail open)
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS, reset: now + RATE_LIMIT.WINDOW_MS };
  }
}

/**
 * Compute related works based on similarity
 */
function computeRelatedWorks(
  targetWork: WorkMetadata,
  allWorks: WorkMetadata[],
  limit = 5
): RelatedWork[] {
  const scores: Array<{ work: WorkMetadata; score: number; reasons: string[] }> = [];

  for (const work of allWorks) {
    if (work.slug === targetWork.slug) continue;

    let score = 0;
    const reasons: string[] = [];

    // Author match (strongest signal)
    const sharedAuthors = work.author.filter(a =>
      targetWork.author.some(ta => ta.toLowerCase() === a.toLowerCase())
    );
    if (sharedAuthors.length > 0) {
      score += 10 * sharedAuthors.length;
      reasons.push(`Same author: ${sharedAuthors.join(', ')}`);
    }

    // Collection match
    const sharedCollections = work.collections.filter(c =>
      targetWork.collections.includes(c)
    );
    if (sharedCollections.length > 0) {
      score += 5 * sharedCollections.length;
      reasons.push('Same collection');
    }

    // Genre match
    const sharedGenres = work.genre.filter(g =>
      targetWork.genre.some(tg => tg.toLowerCase() === g.toLowerCase())
    );
    if (sharedGenres.length > 0) {
      score += 3 * sharedGenres.length;
      reasons.push('Similar genre');
    }

    // Language match
    const sharedLanguages = work.language.filter(l =>
      targetWork.language.some(tl => tl.toLowerCase() === l.toLowerCase())
    );
    if (sharedLanguages.length > 0) {
      score += 2 * sharedLanguages.length;
      reasons.push('Same language');
    }

    if (score > 0) {
      scores.push({ work, score, reasons });
    }
  }

  // Sort by score and return top N
  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, limit).map(({ work, score, reasons }) => ({
    slug: work.slug,
    title: work.title,
    author: work.author,
    reason: reasons.join(', '),
    score,
  }));
}

/**
 * Handle /api/related-works/:slug
 */
async function handleRelatedWorks(
  request: Request,
  env: Env,
  slug: string,
  corsHeaders: Record<string, string>,
  rateLimitHeaders: Record<string, string>
): Promise<Response> {
  const cacheKey = `related:${slug}`;

  // Try cache first
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: {
        ...corsHeaders,
        ...rateLimitHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'HIT',
      },
    });
  }

  // In production, this metadata would be stored in KV or D1
  // For now, return empty array with instructions
  const related: RelatedWork[] = [];

  // Cache the result
  await env.CACHE.put(cacheKey, JSON.stringify(related), {
    expirationTtl: 86400, // 24 hours
  });

  return new Response(JSON.stringify(related), {
    headers: {
      ...corsHeaders,
      ...rateLimitHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'X-Cache': 'MISS',
    },
  });
}

/**
 * Handle /api/stats
 */
async function handleStats(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  rateLimitHeaders: Record<string, string>
): Promise<Response> {
  const cacheKey = 'stats:global';

  // Try cache
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: {
        ...corsHeaders,
        ...rateLimitHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'HIT',
      },
    });
  }

  // Compute stats (in real implementation, from D1)
  const stats = {
    totalWorks: 258,
    totalAuthors: 0,
    totalLanguages: 0,
    lastUpdated: new Date().toISOString(),
  };

  // Cache
  await env.CACHE.put(cacheKey, JSON.stringify(stats), {
    expirationTtl: 600, // 10 minutes
  });

  return new Response(JSON.stringify(stats), {
    headers: {
      ...corsHeaders,
      ...rateLimitHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      'X-Cache': 'MISS',
    },
  });
}

/**
 * Main worker handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Determine which CORS headers to use based on environment
    const isDev = url.hostname === 'localhost' || url.hostname.includes('127.0.0.1');
    const corsHeaders = isDev ? CORS_HEADERS_DEV : CORS_HEADERS;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(request, env);
    const rateLimitHeaders = {
      'X-RateLimit-Limit': RATE_LIMIT.MAX_REQUESTS.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimit.reset).toISOString(),
    };

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Route handling
    if (url.pathname.startsWith('/api/related-works/')) {
      const slug = url.pathname.split('/api/related-works/')[1];
      return handleRelatedWorks(request, env, slug, corsHeaders, rateLimitHeaders);
    }

    if (url.pathname === '/api/stats') {
      return handleStats(request, env, corsHeaders, rateLimitHeaders);
    }

    // Health check
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: {
          ...corsHeaders,
          ...rateLimitHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    // 404
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: {
        ...corsHeaders,
        ...rateLimitHeaders,
        'Content-Type': 'application/json',
      },
    });
  },
};
