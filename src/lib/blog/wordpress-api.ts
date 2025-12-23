import type { WPPost, WPCategory, WPTag } from "./types";

const WP_BASE_URL = "https://painclinics.com";
const WP_API_BASE = `${WP_BASE_URL}/wp-json/wp/v2`;

interface FetchPostsResponse {
  posts: WPPost[];
  totalPages: number;
  totalPosts: number;
}

/**
 * Fetch paginated posts from WordPress REST API
 * @param page - Page number (starts at 1)
 * @param perPage - Number of posts per page (max 100)
 */
export async function fetchWPPosts(
  page = 1,
  perPage = 100
): Promise<FetchPostsResponse> {
  const url = `${WP_API_BASE}/posts?page=${page}&per_page=${perPage}&_embed`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 400) {
      // No more pages available
      return { posts: [], totalPages: page - 1, totalPosts: 0 };
    }
    throw new Error(`WP API error: ${response.status}`);
  }

  return {
    posts: await response.json(),
    totalPages: parseInt(response.headers.get("X-WP-TotalPages") || "1"),
    totalPosts: parseInt(response.headers.get("X-WP-Total") || "0"),
  };
}

/**
 * Fetch all posts from WordPress (paginated automatically)
 * @param onProgress - Optional callback for progress updates
 */
export async function fetchAllWPPosts(
  onProgress?: (current: number, total: number) => void
): Promise<WPPost[]> {
  const allPosts: WPPost[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const { posts, totalPages: total, totalPosts } = await fetchWPPosts(page, 100);

    if (posts.length === 0) break;

    allPosts.push(...posts);
    totalPages = total;

    onProgress?.(allPosts.length, totalPosts);

    page++;

    // Small delay to avoid rate limiting
    if (page <= totalPages) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return allPosts;
}

/**
 * Fetch a single post by slug
 */
export async function fetchWPPostBySlug(slug: string): Promise<WPPost | null> {
  const url = `${WP_API_BASE}/posts?slug=${encodeURIComponent(slug)}&_embed`;
  const response = await fetch(url);

  if (!response.ok) return null;

  const posts = await response.json();
  return posts[0] || null;
}

/**
 * Fetch a single post by WordPress ID
 */
export async function fetchWPPostById(wpId: number): Promise<WPPost | null> {
  const url = `${WP_API_BASE}/posts/${wpId}?_embed`;
  const response = await fetch(url);

  if (!response.ok) return null;

  return response.json();
}

/**
 * Fetch all categories from WordPress
 */
export async function fetchAllWPCategories(): Promise<WPCategory[]> {
  const categories: WPCategory[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `${WP_API_BASE}/categories?page=${page}&per_page=100`
    );

    if (!response.ok) break;

    const batch = await response.json();
    if (batch.length === 0) break;

    categories.push(...batch);
    page++;

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 100));
  }

  return categories;
}

/**
 * Fetch all tags from WordPress
 */
export async function fetchAllWPTags(): Promise<WPTag[]> {
  const tags: WPTag[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(`${WP_API_BASE}/tags?page=${page}&per_page=100`);

    if (!response.ok) break;

    const batch = await response.json();
    if (batch.length === 0) break;

    tags.push(...batch);
    page++;

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 100));
  }

  return tags;
}

/**
 * Decode HTML entities commonly found in WordPress titles/content
 */
export function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
    "&apos;": "'",
    "&#8211;": "–",
    "&#8212;": "—",
    "&#8216;": "'",
    "&#8217;": "'",
    "&#8220;": "\u201C",
    "&#8221;": "\u201D",
    "&nbsp;": " ",
    "&#8230;": "…",
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replaceAll(entity, char);
  }

  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10))
  );

  // Handle hex entities
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );

  return decoded;
}

/**
 * Get the featured image URL from a WordPress post with embedded data
 */
export function getFeaturedImageFromPost(post: WPPost): {
  url: string | null;
  alt: string | null;
} {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) {
    return { url: null, alt: null };
  }
  return {
    url: media.source_url || null,
    alt: media.alt_text || null,
  };
}

/**
 * Get the author info from a WordPress post with embedded data
 */
export function getAuthorFromPost(post: WPPost): {
  name: string | null;
  slug: string | null;
} {
  const author = post._embedded?.author?.[0];
  if (!author) {
    return { name: null, slug: null };
  }
  return {
    name: author.name || null,
    slug: author.slug || null,
  };
}
