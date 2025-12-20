import { getStateAbbreviation } from "./us-states";

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

export interface PopularTime {
  hour: string;
  popularity: number;
}

export interface ReviewsPerScore {
  [score: string]: number;
}

/**
 * Raw CSV row type with all possible WordPress export fields
 * Supports both old (legacy) and new column naming conventions
 */
export interface RawClinicCSVRow {
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
  clinicHours: ClinicHour[] | null;
  closedOn: string | null;
  popularTimes: PopularTime[] | null;
  featuredReviews: FeaturedReview[] | null;
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
 */
export function transformClinicRow(row: RawClinicCSVRow): TransformedClinic | null {
  // Validate required fields
  const title = row.Title?.trim();
  const city = row.City?.trim();
  const state = row.State?.trim();
  const postalCode = row["Postal Code"]?.trim();
  const coordinates = validateCoordinates(
    row["Map Latitude"],
    row["Map Longitude"]
  );

  if (!title || !city || !state || !postalCode || !coordinates) {
    return null; // Skip rows missing required fields
  }

  return {
    wpId: safeParseInt(row.ID),
    placeId: emptyToNull(row["Place ID"]),
    title,
    permalink: extractPermalinkPath(row.Permalink) || `pain-management/${title.toLowerCase().replace(/\s+/g, "-")}`,
    postType: emptyToNull(row["Post Type"]),
    clinicType: emptyToNull(row["Clinic Type"]),
    streetAddress: emptyToNull(row["Street Address"]),
    city,
    state,
    stateAbbreviation:
      row["State Abbreviation"]?.trim() || getStateAbbreviation(state),
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
