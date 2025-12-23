import { getStateAbbreviation, getStateName } from "./us-states";

/**
 * Type definitions for transformed clinic data structures
 */
export interface ReviewKeyword {
  keyword: string;
  count: number;
}

export interface ClinicHour {
  day: string;
  hours: string;
}

export interface FeaturedReview {
  username: string | null;
  url: string | null;
  review: string | null;
  date: string | null;
  rating: number | null;
}

/**
 * Detailed review from Outscraper with full metadata
 */
export interface DetailedReview {
  review_id?: string;
  review_text?: string;
  review_rating?: number;
  author_title?: string;
  author_link?: string;
  review_datetime_utc?: string;
  owner_answer?: string;
  review_likes?: number;
}

export interface PopularTime {
  hour: string;
  popularity: number;
}

export interface ReviewsPerScore {
  [score: string]: number;
}

/**
 * Raw CSV row type with all possible fields
 * Supports WordPress export, Outscraper, and Google Places formats
 */
export interface RawClinicCSVRow {
  // WordPress format
  ID?: string;
  Title?: string;
  "Place ID"?: string;
  Permalink?: string;
  "Post Type"?: string;
  "Clinic Type"?: string;
  "Street Address"?: string;
  City?: string;
  State?: string;
  "State Abbreviation"?: string;
  "Postal Code"?: string;
  "Map Latitude"?: string;
  "Map Longitude"?: string;
  "Detailed Address"?: string;
  Phone?: string;
  phones?: string;
  Website?: string;
  emails?: string;
  Reviews?: string;
  Rating?: string;

  // Outscraper/Google Places format
  place_id?: string;
  name?: string;
  description?: string;
  link?: string;
  reviews?: string;
  rating?: string;
  website?: string;
  phone?: string;
  main_category?: string;
  categories?: string;
  workday_timing?: string;
  closed_on?: string;
  address?: string;
  reviews_per_rating?: string;
  coordinates?: string;
  detailed_address?: string;
  hours?: string;
  featured_image?: string;
  images?: string;
  featured_images?: string;
  review_keywords?: string;
  featured_reviews?: string;
  about?: string;
  range?: string; // Price range from Outscraper (e.g., "$", "$$", "$$$")
  detailed_reviews?: string; // Full review objects JSON array from Outscraper

  // Scraper format columns (no coordinates, has additional metadata)
  is_spending_on_ads?: string;
  competitors?: string;
  can_claim?: string;
  owner_name?: string;
  owner_profile_link?: string;
  is_temporarily_closed?: string;
  query?: string;

  // Reviews Per Score - Legacy format (individual columns)
  "Reviews Per Score Rating_1"?: string;
  "Reviews Per Score Rating_2"?: string;
  "Reviews Per Score Rating_3"?: string;
  "Reviews Per Score Rating_4"?: string;
  "Reviews Per Score Rating_5"?: string;
  // Reviews Per Score - New format (pipe-delimited)
  "Reviews Per Score Rating_review_score_number"?: string;
  "Reviews Per Score Rating_review_score_count"?: string;

  // Review Keywords - Legacy format
  "Review Keywords_Keyword"?: string;
  "Review Keywords_Count"?: string;
  // Review Keywords - New format
  "Review Keywords_keyword"?: string;
  "Review Keywords_keyword_count"?: string;

  // Clinic Hours - Legacy format
  "Clinic Hours_Days"?: string;
  "Clinic Hours_Hours"?: string;
  // Clinic Hours - New format
  "Clinic Hours_day"?: string;
  "Clinic Hours_hours"?: string;

  "Closed On"?: string;

  // Popular Times - Legacy format
  "Popular times_Hours"?: string;
  "Popular times_Popularity"?: string;
  // Popular Times - New format
  "Popular times_hour_of_day"?: string;
  "Popular times_average_popularity"?: string;

  // Featured Reviews - Legacy format
  "Featured Reviews_Google review user profile username"?: string;
  "Featured Reviews_Google review user profile URL"?: string;
  "Featured Reviews_Google Review"?: string;
  "Featured Reviews_Google review publish date"?: string;
  "Featured Reviews_Google review star rating"?: string;
  // Featured Reviews - New format
  "Featured Reviews_username"?: string;
  "Featured Reviews_profile_url"?: string;
  "Featured Reviews_review"?: string;
  "Featured Reviews_date_review_left"?: string;
  "Featured Reviews_rating"?: string;

  Content?: string;
  "New Post Content"?: string;
  "Image URL"?: string;
  "Image Featured"?: string;
  "Feat Image"?: string;
  "Clinic Image URLS"?: string;
  "Clinic Image Media"?: string;
  "QR Code"?: string;
  Amenities?: string;
  "Checkbox Features"?: string;
  "Google Listing Link"?: string;

  // Questions - Legacy format
  Questions?: string;
  // Questions - New format (pipe-delimited Q&A pairs)
  Question?: string;
  Answer?: string;

  // Social Media
  Facebook?: string;
  facebook?: string;
  Instagram?: string;
  instagram?: string;
  Twitter?: string;
  twitter?: string;
  YouTube?: string;
  youtube?: string;
  LinkedIn?: string;
  linkedin?: string;
  TikTok?: string;
  tiktok?: string;
  Pinterest?: string;
  pinterest?: string;

  [key: string]: string | undefined;
}

/**
 * Transformed clinic data ready for database insertion
 */
export interface TransformedClinic {
  wpId: number | null;
  placeId: string | null;
  title: string;
  permalink: string;
  postType: string | null;
  clinicType: string | null;
  streetAddress: string | null;
  city: string;
  state: string;
  stateAbbreviation: string | null;
  postalCode: string;
  mapLatitude: number;
  mapLongitude: number;
  detailedAddress: string | null;
  phone: string | null;
  phones: string[] | null;
  website: string | null;
  emails: string[] | null;
  reviewCount: number;
  rating: number | null;
  reviewsPerScore: ReviewsPerScore | null;
  reviewKeywords: ReviewKeyword[] | null;
  detailedReviews: DetailedReview[] | null;
  allReviewsText: string | null;
  clinicHours: ClinicHour[] | null;
  closedOn: string | null;
  popularTimes: PopularTime[] | null;
  featuredReviews: FeaturedReview[] | null;
  priceRange: string | null;
  businessDescription: string | null;
  content: string | null;
  newPostContent: string | null;
  imageUrl: string | null;
  imageFeatured: string | null;
  featImage: string | null;
  clinicImageUrls: string[] | null;
  clinicImageMedia: string[] | null;
  qrCode: string | null;
  amenities: string[] | null;
  checkboxFeatures: string[] | null;
  googleListingLink: string | null;
  questions: QuestionAnswer[] | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
  linkedin: string | null;
  tiktok: string | null;
  pinterest: string | null;
  status: "draft" | "published";
}

/**
 * Parse review keywords from pipe-separated strings
 * @example parseReviewKeywords("friendly|professional", "15|12") => [{keyword: "friendly", count: 15}, ...]
 */
export function parseReviewKeywords(
  keywords: string | undefined,
  counts: string | undefined
): ReviewKeyword[] | null {
  if (!keywords || !counts) return null;

  const keywordArr = keywords.split("|").map((k) => k.trim()).filter(Boolean);
  const countArr = counts.split("|").map((c) => parseInt(c.trim(), 10));

  if (keywordArr.length === 0) return null;

  return keywordArr.map((keyword, i) => {
    const count = countArr[i];
    return {
      keyword,
      count: count === undefined || isNaN(count) ? 0 : count,
    };
  });
}

/**
 * Parse clinic hours from pipe-separated strings
 * @example parseClinicHours("Monday|Tuesday", "9AM-5PM|9AM-5PM") => [{day: "Monday", hours: "9AM-5PM"}, ...]
 */
export function parseClinicHours(
  days: string | undefined,
  hours: string | undefined
): ClinicHour[] | null {
  if (!days || !hours) return null;

  const dayArr = days.split("|").map((d) => d.trim()).filter(Boolean);
  const hourArr = hours.split("|").map((h) => h.trim());

  if (dayArr.length === 0) return null;

  return dayArr.map((day, i) => ({
    day,
    hours: hourArr[i] || "Closed",
  }));
}

/**
 * Parse featured reviews from pipe-separated strings
 */
export function parseFeaturedReviews(
  usernames: string | undefined,
  urls: string | undefined,
  reviews: string | undefined,
  dates: string | undefined,
  ratings: string | undefined
): FeaturedReview[] | null {
  if (!reviews) return null;

  const usernameArr = usernames?.split("|").map((u) => u.trim()) || [];
  const urlArr = urls?.split("|").map((u) => u.trim()) || [];
  const reviewArr = reviews.split("|").map((r) => r.trim());
  const dateArr = dates?.split("|").map((d) => d.trim()) || [];
  const ratingArr = ratings?.split("|").map((r) => parseFloat(r.trim())) || [];

  if (reviewArr.length === 0 || reviewArr.every((r) => !r)) return null;

  return reviewArr
    .map((review, i) => {
      const rating = ratingArr[i];
      return {
        username: usernameArr[i] || null,
        url: urlArr[i] || null,
        review: review || null,
        date: dateArr[i] || null,
        rating: rating === undefined || isNaN(rating) ? null : rating,
      };
    })
    .filter((r) => r.review); // Only include reviews with content
}

/**
 * Parse popular times from pipe-separated strings
 */
export function parsePopularTimes(
  hours: string | undefined,
  popularity: string | undefined
): PopularTime[] | null {
  if (!hours || !popularity) return null;

  const hourArr = hours.split("|").map((h) => h.trim()).filter(Boolean);
  const popArr = popularity.split("|").map((p) => parseInt(p.trim(), 10));

  if (hourArr.length === 0) return null;

  return hourArr.map((hour, i) => {
    const pop = popArr[i];
    return {
      hour,
      popularity: pop === undefined || isNaN(pop) ? 0 : pop,
    };
  });
}

/**
 * Parse reviews per score into an object
 * Supports both legacy format (individual columns) and new pipe-delimited format
 */
export function parseReviewsPerScore(row: RawClinicCSVRow): ReviewsPerScore | null {
  const scores: ReviewsPerScore = {};
  let hasAny = false;

  // Try new pipe-delimited format first
  const scoreNumbers = row["Reviews Per Score Rating_review_score_number"];
  const scoreCounts = row["Reviews Per Score Rating_review_score_count"];

  if (scoreNumbers && scoreCounts) {
    const scoreArr = scoreNumbers.split("|").map((s) => parseInt(s.trim(), 10));
    const countArr = scoreCounts.split("|").map((c) => parseInt(c.trim(), 10));

    scoreArr.forEach((score, i) => {
      const count = countArr[i];
      if (!isNaN(score) && count !== undefined && !isNaN(count)) {
        scores[`${score}`] = count;
        hasAny = true;
      }
    });

    if (hasAny) return scores;
  }

  // Fall back to legacy format (individual columns)
  for (let i = 1; i <= 5; i++) {
    const value = row[`Reviews Per Score Rating_${i}`];
    if (value) {
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
        scores[`${i}`] = num;
        hasAny = true;
      }
    }
  }

  return hasAny ? scores : null;
}

/**
 * Parse scraper format address string into components
 * Handles format: "Street, City, ST ZIP, Country"
 * @example "15 Shrine Club Rd Suite B, Lander, WY 82520, United States"
 */
function parseScraperAddress(address: string | undefined): {
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  stateAbbreviation: string | null;
  postalCode: string | null;
} {
  const empty = {
    streetAddress: null,
    city: null,
    state: null,
    stateAbbreviation: null,
    postalCode: null,
  };

  if (!address) return empty;

  // Format: "Street, City, ST ZIP, Country"
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length < 3) {
    // Not enough parts for full address - store as street address
    return { ...empty, streetAddress: address };
  }

  const streetAddress = parts[0] || null;
  const city = parts[1] || null;

  // Parse "ST ZIP" from third part (e.g., "WY 82520")
  const stateZipPart = parts[2] || "";
  const stateZipMatch = stateZipPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);

  const stateAbbreviation = stateZipMatch?.[1] || null;
  const postalCode = stateZipMatch?.[2] || null;
  const state = stateAbbreviation ? getStateName(stateAbbreviation) : null;

  return { streetAddress, city, state, stateAbbreviation, postalCode };
}

/**
 * Parse scraper format hours from workday_timing + closed_on
 * workday_timing contains the standard hours (e.g., "8 a.m.-5:30 p.m.")
 * closed_on lists days when closed (e.g., "Saturday, Sunday")
 * Special case: "Open All Days" means no closed days
 */
function parseScraperHours(
  workdayTiming: string | undefined,
  closedOn: string | undefined
): ClinicHour[] | null {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // If no timing info at all, return null
  if (!workdayTiming && !closedOn) return null;

  // Parse closed days into a set (lowercase for comparison)
  const closedDays = new Set(
    (closedOn || "")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean)
  );

  // Handle "Open All Days" case - no days are closed
  const isOpenAllDays = closedOn?.toLowerCase().includes("open all days");

  return days.map((day) => ({
    day,
    hours:
      isOpenAllDays || !closedDays.has(day.toLowerCase())
        ? workdayTiming || "Hours not specified"
        : "Closed",
  }));
}

/**
 * Parse scraper format comma-separated keywords into ReviewKeyword array
 * Keywords come without counts, so we default count to 1
 * @example "team, compassionate, questions" => [{keyword: "team", count: 1}, ...]
 */
function parseScraperKeywords(keywords: string | undefined): ReviewKeyword[] | null {
  if (!keywords) return null;

  const keywordList = keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (keywordList.length === 0) return null;

  // No counts provided in scraper format, so default to 1
  return keywordList.map((keyword) => ({ keyword, count: 1 }));
}

/**
 * Parse comma-separated phones into array
 */
export function parsePhones(phones: string | undefined): string[] | null {
  if (!phones) return null;
  const parsed = phones.split(",").map((p) => p.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : null;
}

/**
 * Parse comma-separated emails into array
 */
export function parseEmails(emails: string | undefined): string[] | null {
  if (!emails) return null;
  const parsed = emails.split(",").map((e) => e.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : null;
}

/**
 * Parse comma-separated amenities into array
 */
export function parseAmenities(amenities: string | undefined): string[] | null {
  if (!amenities) return null;
  const parsed = amenities.split(",").map((a) => a.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : null;
}

/**
 * Parse comma or pipe-separated image URLs into array
 */
export function parseImageUrls(urls: string | undefined): string[] | null {
  if (!urls) return null;
  // Split by pipe first (WordPress export format), then by comma
  const parsed = urls.split(/[|,]/).map((u) => u.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : null;
}

/**
 * Get the first URL from a pipe or comma-separated string
 */
export function getFirstImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  const urls = url.split(/[|,]/).map((u) => u.trim()).filter(Boolean);
  return urls.length > 0 ? (urls[0] ?? null) : null;
}

/**
 * Parse pipe-separated checkbox features into array
 */
export function parseCheckboxFeatures(features: string | undefined): string[] | null {
  if (!features) return null;
  const parsed = features.split("|").map((f) => f.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : null;
}

/**
 * Question and Answer pair
 */
export interface QuestionAnswer {
  question: string;
  answer: string;
}

/**
 * Parse questions and answers from pipe-separated strings
 * New format uses separate Question and Answer columns
 */
export function parseQuestions(
  questions: string | undefined,
  answers: string | undefined
): QuestionAnswer[] | null {
  if (!questions || !answers) return null;

  const qArr = questions.split("|").map((q) => q.trim()).filter(Boolean);
  const aArr = answers.split("|").map((a) => a.trim());

  if (qArr.length === 0) return null;

  const result = qArr
    .map((question, i) => ({
      question,
      answer: aArr[i] || "",
    }))
    .filter((qa) => qa.question && qa.answer);

  return result.length > 0 ? result : null;
}

/**
 * Validate and parse coordinates
 * @returns Object with lat/lng or null if invalid
 */
export function validateCoordinates(
  lat: string | undefined,
  lng: string | undefined
): { lat: number; lng: number } | null {
  if (!lat || !lng) return null;

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  // Basic validation
  if (isNaN(latitude) || isNaN(longitude)) return null;
  if (latitude < -90 || latitude > 90) return null;
  if (longitude < -180 || longitude > 180) return null;

  return { lat: latitude, lng: longitude };
}

/**
 * Extract permalink slug from full URL
 * @example "https://example.com/clinic/pain-center-dallas/" => "pain-center-dallas"
 */
export function extractPermalinkSlug(fullUrl: string | undefined): string {
  if (!fullUrl) return "";

  // Remove trailing slash and get last segment
  const cleaned = fullUrl.replace(/\/$/, "");
  const segments = cleaned.split("/");
  return segments[segments.length - 1] || "";
}

/**
 * Extract permalink path from full URL, preserving the pain-management/ prefix
 * @example "https://painclinics.com/pain-management/clinic-name-al-35243/" => "pain-management/clinic-name-al-35243"
 */
export function extractPermalinkPath(fullUrl: string | undefined): string {
  if (!fullUrl) return "";

  // Remove trailing slash
  const cleaned = fullUrl.replace(/\/$/, "");

  // Try to extract path starting from pain-management/
  const painMgmtMatch = cleaned.match(/pain-management\/[\w-]+/i);
  if (painMgmtMatch) {
    return painMgmtMatch[0].toLowerCase();
  }

  // Fallback: extract last two segments if they look like a valid path
  const segments = cleaned.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const lastTwo = segments.slice(-2).join("/");
    if (lastTwo.includes("pain-management")) {
      return lastTwo.toLowerCase();
    }
  }

  // Final fallback: just the slug with default prefix
  const slug = segments[segments.length - 1] || "";
  return slug ? `pain-management/${slug.toLowerCase()}` : "";
}

/**
 * Generate a unique permalink slug from title, state abbreviation, and zip code
 * Format: {title-slug}-{state-abbr}-{zipcode}
 * @example generatePermalinkSlug("Pain Care Centers", "WY", "82901") => "pain-care-centers-wy-82901"
 */
export function generatePermalinkSlug(
  title: string,
  stateAbbreviation: string,
  postalCode: string
): string {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens

  const stateAbbr = stateAbbreviation.toLowerCase();
  const zip = postalCode.replace(/\s+/g, ""); // Remove any spaces in zip

  return `${titleSlug}-${stateAbbr}-${zip}`;
}

/**
 * Safely parse JSON string
 */
function safeParseJSON<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Parse Outscraper coordinates JSON
 * @example '{"latitude":42.8397996,"longitude":-108.71708}' => { lat: 42.84, lng: -108.72 }
 */
function parseOutscraperCoordinates(coords: string | undefined): { lat: number; lng: number } | null {
  const parsed = safeParseJSON<{ latitude?: number; longitude?: number }>(coords);
  if (!parsed || typeof parsed.latitude !== 'number' || typeof parsed.longitude !== 'number') {
    return null;
  }
  return { lat: parsed.latitude, lng: parsed.longitude };
}

/**
 * Parse Outscraper detailed_address JSON
 * @example '{"ward":null,"street":"15 Shrine Club Rd","city":"Lander","state":"Wyoming","postal_code":"82520"}'
 */
interface OutscraperDetailedAddress {
  ward?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

function parseOutscraperDetailedAddress(addr: string | undefined): OutscraperDetailedAddress | null {
  return safeParseJSON<OutscraperDetailedAddress>(addr);
}

/**
 * Parse Outscraper hours JSON array
 * @example '[{"day":"Monday","times":["8 a.m.-5:30 p.m."]}]'
 */
function parseOutscraperHours(hours: string | undefined): ClinicHour[] | null {
  const parsed = safeParseJSON<Array<{ day?: string; times?: string[] }>>(hours);
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) return null;

  const result: ClinicHour[] = [];
  for (const item of parsed) {
    if (item.day && item.times && item.times.length > 0) {
      result.push({
        day: item.day,
        hours: item.times.join(', '),
      });
    }
  }
  return result.length > 0 ? result : null;
}

/**
 * Parse Outscraper review_keywords JSON array
 * @example '[{"keyword":"team","count":10},{"keyword":"compassionate","count":8}]'
 */
function parseOutscraperReviewKeywords(keywords: string | undefined): ReviewKeyword[] | null {
  const parsed = safeParseJSON<Array<{ keyword?: string; count?: number }>>(keywords);
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) return null;

  const result: ReviewKeyword[] = [];
  for (const item of parsed) {
    if (item.keyword) {
      result.push({
        keyword: item.keyword,
        count: item.count || 0,
      });
    }
  }
  return result.length > 0 ? result : null;
}

/**
 * Parse Outscraper reviews_per_rating JSON
 * @example '{"1":3,"2":0,"3":0,"4":10,"5":160}'
 */
function parseOutscraperReviewsPerRating(ratings: string | undefined): ReviewsPerScore | null {
  const parsed = safeParseJSON<Record<string, number>>(ratings);
  if (!parsed || Object.keys(parsed).length === 0) return null;
  return parsed;
}

/**
 * Parse Outscraper featured_reviews JSON array
 */
function parseOutscraperFeaturedReviews(reviews: string | undefined): FeaturedReview[] | null {
  const parsed = safeParseJSON<Array<{
    review_id?: string;
    author_title?: string;
    author_link?: string;
    review_text?: string;
    review_datetime_utc?: string;
    review_rating?: number;
  }>>(reviews);
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) return null;

  const result: FeaturedReview[] = [];
  for (const item of parsed) {
    if (item.review_text) {
      result.push({
        username: item.author_title || null,
        url: item.author_link || null,
        review: item.review_text,
        date: item.review_datetime_utc || null,
        rating: item.review_rating || null,
      });
    }
  }
  return result.length > 0 ? result : null;
}

/**
 * Parse Outscraper closed_on JSON array
 * @example '["Saturday","Sunday"]'
 */
function parseOutscraperClosedOn(closedOn: string | undefined): string | null {
  const parsed = safeParseJSON<string[]>(closedOn);
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) return null;
  return parsed.join(', ');
}

/**
 * Get first image from Outscraper featured_image or featured_images
 */
function parseOutscraperFeaturedImage(
  featuredImage: string | undefined,
  featuredImages: string | undefined
): string | null {
  // Try direct URL first
  if (featuredImage && featuredImage.startsWith('http')) {
    return featuredImage;
  }

  // Try featured_images JSON array
  const parsed = safeParseJSON<Array<{ link?: string }>>(featuredImages);
  if (parsed && Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.link) {
    return parsed[0].link;
  }

  return null;
}

/**
 * Parse Outscraper categories JSON array
 * @example '["Pain control clinic","Doctor","Pain management physician"]'
 */
function parseOutscraperCategories(categories: string | undefined): string[] | null {
  const parsed = safeParseJSON<string[]>(categories);
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) return null;
  return parsed;
}

/**
 * Parse Outscraper images JSON array
 * @example '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]'
 */
function parseOutscraperImages(images: string | undefined): string[] | null {
  if (!images) return null;
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed)) {
      return parsed.filter((url): url is string => typeof url === 'string' && url.startsWith('http'));
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse Outscraper detailed_reviews JSON array
 * Contains full review objects with text, rating, author, date, etc.
 */
function parseOutscraperDetailedReviews(reviews: string | undefined): DetailedReview[] | null {
  if (!reviews) return null;
  try {
    const parsed = JSON.parse(reviews);
    if (Array.isArray(parsed)) {
      return parsed as DetailedReview[];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Select the best featured reviews from detailed reviews
 * Prioritizes 5-star reviews with substantial text, sorted by likes
 * @param reviews - Array of detailed reviews
 * @param limit - Maximum number of featured reviews to select (default 5)
 * @returns Selected featured reviews in FeaturedReview format
 */
export function selectFeaturedReviews(
  reviews: DetailedReview[] | null,
  limit: number = 5
): FeaturedReview[] | null {
  if (!reviews || reviews.length === 0) return null;

  // Filter for high-quality reviews: 5 stars with text > 50 chars
  const qualityReviews = reviews.filter(
    (r) => r.review_rating === 5 && r.review_text && r.review_text.length > 50
  );

  // If not enough 5-star reviews, include 4-star reviews
  let candidates = qualityReviews;
  if (candidates.length < limit) {
    const fourStarReviews = reviews.filter(
      (r) => r.review_rating === 4 && r.review_text && r.review_text.length > 50
    );
    candidates = [...candidates, ...fourStarReviews];
  }

  // Sort by likes (descending), then by text length as tiebreaker
  const sorted = candidates.sort((a, b) => {
    const likeDiff = (b.review_likes || 0) - (a.review_likes || 0);
    if (likeDiff !== 0) return likeDiff;
    return (b.review_text?.length || 0) - (a.review_text?.length || 0);
  });

  // Take top 'limit' reviews and convert to FeaturedReview format
  const selected = sorted.slice(0, limit).map((r): FeaturedReview => ({
    username: r.author_title || null,
    url: r.author_link || null,
    review: r.review_text?.replace(/<[^>]*>/g, '').trim() || null,
    date: r.review_datetime_utc || null,
    rating: r.review_rating || null,
  }));

  return selected.length > 0 ? selected : null;
}

/**
 * Create stripped reviews text for AI content generation
 * Concatenates all review text, stripping HTML tags
 */
function createStrippedReviewsText(reviews: DetailedReview[] | null): string | null {
  if (!reviews || reviews.length === 0) return null;

  const textParts = reviews
    .map((r) => r.review_text?.replace(/<[^>]*>/g, '').trim())
    .filter((text): text is string => Boolean(text));

  if (textParts.length === 0) return null;

  return textParts.join('\n\n---\n\n');
}

/**
 * Extract clinic type from categories array
 * Prioritizes pain-related categories, falls back to first category
 */
function extractClinicType(categories: string[] | null): string | null {
  if (!categories || categories.length === 0) return null;

  const painKeywords = ['pain', 'anesthesi', 'physiatr', 'interventional', 'spine'];
  const painCategory = categories.find((c) =>
    painKeywords.some((k) => c.toLowerCase().includes(k))
  );

  return painCategory || categories[0] || null;
}

/**
 * Parse integer safely
 */
function safeParseInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse float safely
 */
function safeParseFloat(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Clean empty string to null
 */
function emptyToNull(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

/**
 * Transform a raw CSV row into a clinic object ready for database insertion
 * Supports WordPress export, Outscraper/Google Places, and Scraper formats
 */
export function transformClinicRow(row: RawClinicCSVRow): TransformedClinic | null {
  // Detect format by checking distinctive column combinations:
  // - Outscraper: has 'name' AND 'coordinates' (JSON object with lat/lng)
  // - Scraper: has 'name', 'place_id', 'main_category' but NO 'coordinates' (address string only)
  // - WordPress: has 'Title' and 'Map Latitude' (explicit columns)
  const isOutscraperFormat = !!row.name && !!row.coordinates;
  const isScraperFormat =
    !isOutscraperFormat && !!row.name && !!row.place_id && !!row.main_category;

  // ========== SCRAPER FORMAT ==========
  // Handle scraper format first (early return) - no coordinates available
  if (isScraperFormat) {
    const scraperTitle = row.name?.trim();
    if (!scraperTitle) return null;

    // Parse address components from "Street, City, ST ZIP, Country" format
    const addr = parseScraperAddress(row.address);

    // Validate we have minimal location data
    if (!addr.city && !addr.postalCode && !row.address) {
      return null; // Skip rows with no location data
    }

    // Parse categories into array for checkboxFeatures
    const categories = row.categories
      ?.split(",")
      .map((c) => c.trim())
      .filter(Boolean) || null;

    // Build state abbreviation - from parsed address or derive from state name
    const scraperStateAbbr = addr.stateAbbreviation ||
      (addr.state ? getStateAbbreviation(addr.state) : null) || "";

    return {
      wpId: null,
      placeId: emptyToNull(row.place_id),
      title: scraperTitle,
      permalink: `pain-management/${generatePermalinkSlug(
        scraperTitle,
        scraperStateAbbr,
        addr.postalCode || ""
      )}`,
      postType: "pain-management",
      clinicType: emptyToNull(row.main_category),
      streetAddress: addr.streetAddress,
      city: addr.city || "",
      state: addr.state || "",
      stateAbbreviation: scraperStateAbbr || null,
      postalCode: addr.postalCode || "",
      mapLatitude: 0, // Not provided in scraper format - would need geocoding
      mapLongitude: 0,
      detailedAddress: emptyToNull(row.address),
      phone: emptyToNull(row.phone),
      phones: null,
      website: emptyToNull(row.website),
      emails: null,
      reviewCount: safeParseInt(row.reviews) || 0,
      rating: safeParseFloat(row.rating),
      reviewsPerScore: null,
      reviewKeywords: parseScraperKeywords(row.review_keywords),
      detailedReviews: null,
      allReviewsText: null,
      clinicHours: parseScraperHours(row.workday_timing, row.closed_on),
      closedOn: emptyToNull(row.closed_on),
      popularTimes: null,
      featuredReviews: null,
      priceRange: null,
      businessDescription: emptyToNull(row.description),
      content: null,
      newPostContent: null,
      imageUrl: emptyToNull(row.featured_image),
      imageFeatured: emptyToNull(row.featured_image),
      featImage: null,
      clinicImageUrls: null,
      clinicImageMedia: null,
      qrCode: null,
      amenities: null,
      checkboxFeatures: categories,
      googleListingLink: emptyToNull(row.link),
      questions: null,
      facebook: null,
      instagram: null,
      twitter: null,
      youtube: null,
      linkedin: null,
      tiktok: null,
      pinterest: null,
      status: "draft", // Import as draft for review before publishing
    };
  }

  // ========== OUTSCRAPER & WORDPRESS FORMATS ==========
  let title: string | undefined;
  let city: string | undefined;
  let state: string | undefined;
  let postalCode: string | undefined;
  let streetAddress: string | undefined;
  let coordinates: { lat: number; lng: number } | null = null;

  if (isOutscraperFormat) {
    // Parse Outscraper format
    title = row.name?.trim();
    coordinates = parseOutscraperCoordinates(row.coordinates);

    // Parse detailed_address for city, state, postal code, street
    const detailedAddr = parseOutscraperDetailedAddress(row.detailed_address);
    if (detailedAddr) {
      city = detailedAddr.city || undefined;
      state = detailedAddr.state || undefined;
      postalCode = detailedAddr.postal_code || undefined;
      streetAddress = detailedAddr.street || undefined;
    }

    // Fallback: parse from address string if detailed_address didn't have all fields
    if (!city || !state || !postalCode) {
      const addressMatch = row.address?.match(/([^,]+),\s*([A-Z]{2})\s+(\d{5})/);
      if (addressMatch) {
        city = city || addressMatch[1]?.trim();
        const stateAbbrev = addressMatch[2];
        state = state || (stateAbbrev ? getStateName(stateAbbrev) || stateAbbrev : undefined);
        postalCode = postalCode || addressMatch[3];
      }
    }
  } else {
    // Parse WordPress format
    title = row.Title?.trim();
    city = row.City?.trim();
    state = row.State?.trim();
    postalCode = row["Postal Code"]?.trim();
    streetAddress = row["Street Address"]?.trim();
    coordinates = validateCoordinates(row["Map Latitude"], row["Map Longitude"]);
  }

  // Validate required fields
  if (!title || !city || !state || !postalCode || !coordinates) {
    return null; // Skip rows missing required fields
  }

  // Get state abbreviation for permalink generation
  const stateAbbr = row["State Abbreviation"]?.trim() || getStateAbbreviation(state) || "";

  if (isOutscraperFormat) {
    // Parse categories and images upfront for reuse
    const categories = parseOutscraperCategories(row.categories);
    const parsedImages = parseOutscraperImages(row.images);
    const detailedReviews = parseOutscraperDetailedReviews(row.detailed_reviews);

    // Determine clinic type from categories
    const clinicType = emptyToNull(row.main_category) || extractClinicType(categories);

    // Featured image: try dedicated field first, then first image from array
    const featuredImage = parseOutscraperFeaturedImage(row.featured_image, row.featured_images)
      || parsedImages?.[0] || null;

    // Return Outscraper-parsed data
    return {
      wpId: null,
      placeId: emptyToNull(row.place_id),
      title,
      permalink: `pain-management/${generatePermalinkSlug(title, stateAbbr, postalCode)}`,
      postType: null,
      clinicType,
      streetAddress: streetAddress || null,
      city,
      state,
      stateAbbreviation: stateAbbr || null,
      postalCode,
      mapLatitude: coordinates.lat,
      mapLongitude: coordinates.lng,
      detailedAddress: emptyToNull(row.address),
      phone: emptyToNull(row.phone),
      phones: null,
      website: emptyToNull(row.website),
      emails: null,
      reviewCount: safeParseInt(row.reviews) || 0,
      rating: safeParseFloat(row.rating),
      reviewsPerScore: parseOutscraperReviewsPerRating(row.reviews_per_rating),
      reviewKeywords: parseOutscraperReviewKeywords(row.review_keywords),
      detailedReviews,
      allReviewsText: createStrippedReviewsText(detailedReviews),
      clinicHours: parseOutscraperHours(row.hours),
      closedOn: parseOutscraperClosedOn(row.closed_on),
      popularTimes: null, // Could parse popular_times if needed
      // Featured reviews: use Outscraper's featured_reviews if available,
      // otherwise auto-select best reviews from detailed_reviews
      featuredReviews: parseOutscraperFeaturedReviews(row.featured_reviews)
        || selectFeaturedReviews(detailedReviews),
      priceRange: emptyToNull(row.range),
      businessDescription: emptyToNull(row.about),
      content: emptyToNull(row.description),
      newPostContent: null,
      imageUrl: featuredImage,
      imageFeatured: featuredImage,
      featImage: null,
      clinicImageUrls: parsedImages,
      clinicImageMedia: null,
      qrCode: null,
      amenities: null,
      checkboxFeatures: categories,
      googleListingLink: emptyToNull(row.link),
      questions: null,
      facebook: null,
      instagram: null,
      twitter: null,
      youtube: null,
      linkedin: null,
      tiktok: null,
      pinterest: null,
      status: "draft", // Import as draft for review before publishing
    };
  }

  // Return WordPress-parsed data
  return {
    wpId: safeParseInt(row.ID),
    placeId: emptyToNull(row["Place ID"]),
    title,
    permalink: extractPermalinkPath(row.Permalink) || `pain-management/${generatePermalinkSlug(title, stateAbbr, postalCode)}`,
    postType: emptyToNull(row["Post Type"]),
    clinicType: emptyToNull(row["Clinic Type"]),
    streetAddress: streetAddress || null,
    city,
    state,
    stateAbbreviation: stateAbbr || null,
    postalCode,
    mapLatitude: coordinates.lat,
    mapLongitude: coordinates.lng,
    detailedAddress: emptyToNull(row["Detailed Address"]),
    phone: emptyToNull(row.Phone),
    phones: parsePhones(row.phones),
    website: emptyToNull(row.Website),
    emails: parseEmails(row.emails),
    reviewCount: safeParseInt(row.Reviews) || 0,
    rating: safeParseFloat(row.Rating),
    reviewsPerScore: parseReviewsPerScore(row),
    // Review Keywords: try new format first, then legacy
    reviewKeywords: parseReviewKeywords(
      row["Review Keywords_keyword"] || row["Review Keywords_Keyword"],
      row["Review Keywords_keyword_count"] || row["Review Keywords_Count"]
    ),
    // Detailed reviews and stripped text not available in WordPress format
    detailedReviews: null,
    allReviewsText: null,
    // Clinic Hours: try new format first, then legacy
    clinicHours: parseClinicHours(
      row["Clinic Hours_day"] || row["Clinic Hours_Days"],
      row["Clinic Hours_hours"] || row["Clinic Hours_Hours"]
    ),
    closedOn: emptyToNull(row["Closed On"]),
    // Popular Times: try new format first, then legacy
    popularTimes: parsePopularTimes(
      row["Popular times_hour_of_day"] || row["Popular times_Hours"],
      row["Popular times_average_popularity"] || row["Popular times_Popularity"]
    ),
    // Featured Reviews: try new format first, then legacy
    featuredReviews: parseFeaturedReviews(
      row["Featured Reviews_username"] ||
        row["Featured Reviews_Google review user profile username"],
      row["Featured Reviews_profile_url"] ||
        row["Featured Reviews_Google review user profile URL"],
      row["Featured Reviews_review"] || row["Featured Reviews_Google Review"],
      row["Featured Reviews_date_review_left"] ||
        row["Featured Reviews_Google review publish date"],
      row["Featured Reviews_rating"] ||
        row["Featured Reviews_Google review star rating"]
    ),
    // Price range and business description not available in WordPress format
    priceRange: null,
    businessDescription: null,
    content: emptyToNull(row.Content),
    newPostContent: emptyToNull(row["New Post Content"]),
    imageUrl: getFirstImageUrl(row["Image URL"]),
    imageFeatured: getFirstImageUrl(row["Image Featured"]),
    featImage: getFirstImageUrl(row["Feat Image"]),
    clinicImageUrls: parseImageUrls(row["Clinic Image URLS"]),
    clinicImageMedia: parseImageUrls(row["Clinic Image Media"]),
    qrCode: emptyToNull(row["QR Code"]),
    amenities: parseAmenities(row.Amenities),
    checkboxFeatures: parseCheckboxFeatures(row["Checkbox Features"]),
    googleListingLink: emptyToNull(row["Google Listing Link"]),
    // Questions: try new format (separate columns) first
    questions: parseQuestions(row.Question, row.Answer),
    // Social Media: try lowercase first (new format), then Title case (legacy)
    facebook: emptyToNull(row.facebook || row.Facebook),
    instagram: emptyToNull(row.instagram || row.Instagram),
    twitter: emptyToNull(row.twitter || row.Twitter),
    youtube: emptyToNull(row.youtube || row.YouTube),
    linkedin: emptyToNull(row.linkedin || row.LinkedIn),
    tiktok: emptyToNull(row.tiktok || row.TikTok),
    pinterest: emptyToNull(row.pinterest || row.Pinterest),
    status: "draft", // Import as draft for review before publishing
  };
}


/**
 * Transform multiple CSV rows, filtering out invalid ones
 * @returns Object with transformed clinics and skipped row indices
 */
export function transformClinicRows(
  rows: RawClinicCSVRow[]
): { clinics: TransformedClinic[]; skipped: number[] } {
  const clinics: TransformedClinic[] = [];
  const skipped: number[] = [];

  rows.forEach((row, index) => {
    const transformed = transformClinicRow(row);
    if (transformed) {
      clinics.push(transformed);
    } else {
      skipped.push(index);
    }
  });

  return { clinics, skipped };
}
