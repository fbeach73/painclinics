// Content Validation for Optimization
// Ensures critical elements are preserved during optimization

export interface ValidationResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
  requiresManualReview: boolean;
}

export interface ClinicValidationContext {
  title: string;
  city: string;
  state: string;
  streetAddress?: string | null;
  phone?: string | null;
  phones?: string[] | null;
}

/**
 * Extract potential doctor/practitioner names from content
 * Looks for patterns like "Dr. Name", "Doctor Name", etc.
 */
export function extractDoctorNames(content: string): string[] {
  const patterns = [
    /\bDr\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g, // Dr. First Last
    /\bDoctor\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/gi, // Doctor First Last
    /\b(?:MD|M\.D\.|DO|D\.O\.)\b/gi, // MD, M.D., DO, D.O. suffixes
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+,\s*(?:MD|M\.D\.|DO|D\.O\.)/gi, // Name, MD format
  ];

  const names = new Set<string>();
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach((m) => names.add(m.trim()));
    }
  }

  return Array.from(names);
}

/**
 * Extract phone numbers from content
 */
export function extractPhoneNumbers(content: string): string[] {
  // Match various phone formats
  const pattern = /(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = content.match(pattern);
  return matches ? Array.from(new Set(matches.map((p) => p.trim()))) : [];
}

/**
 * Extract H3 tags from content
 */
export function extractH3Tags(content: string): string[] {
  const pattern = /<h3[^>]*>(.*?)<\/h3>/gi;
  const matches: string[] = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    if (match[1]) {
      matches.push(match[1].trim());
    }
  }
  return matches;
}

/**
 * Count words in content (excluding HTML tags)
 */
export function countWords(content: string): number {
  // Remove HTML tags
  const textOnly = content.replace(/<[^>]*>/g, " ");
  // Split by whitespace and filter empty strings
  const words = textOnly.split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

/**
 * Validate optimized content against original
 */
export function validateOptimizedContent(
  original: string,
  optimized: string,
  clinic: ClinicValidationContext
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. Check doctor names preserved
  const originalDoctors = extractDoctorNames(original);
  for (const doctor of originalDoctors) {
    // Case-insensitive check
    if (!optimized.toLowerCase().includes(doctor.toLowerCase())) {
      errors.push(`Doctor name may be missing: "${doctor}"`);
    }
  }

  // 2. Check city name present
  if (!optimized.toLowerCase().includes(clinic.city.toLowerCase())) {
    errors.push(`City name missing: "${clinic.city}"`);
  }

  // 3. Check state name present (either full or abbreviation)
  const statePresent =
    optimized.toLowerCase().includes(clinic.state.toLowerCase());
  if (!statePresent) {
    warnings.push(`State name not clearly visible: "${clinic.state}"`);
  }

  // 4. Check H3 tags - warn if count changed significantly
  const originalH3s = extractH3Tags(original);
  const optimizedH3s = extractH3Tags(optimized);

  if (optimizedH3s.length === 0 && originalH3s.length > 0) {
    errors.push("All H3 tags removed - structure may be lost");
  } else if (optimizedH3s.length < originalH3s.length - 1) {
    warnings.push(
      `H3 tags reduced from ${originalH3s.length} to ${optimizedH3s.length}`
    );
  }

  // 5. Check phone numbers preserved
  const originalPhones = extractPhoneNumbers(original);
  const optimizedPhones = extractPhoneNumbers(optimized);

  // Also check clinic's phone field
  if (clinic.phone) {
    const phoneDigits = clinic.phone.replace(/\D/g, "");
    const phoneInOptimized = optimizedPhones.some(
      (p) => p.replace(/\D/g, "") === phoneDigits
    );
    if (!phoneInOptimized && originalPhones.length > 0) {
      warnings.push("Primary phone number may not be clearly visible");
    }
  }

  if (originalPhones.length > 0 && optimizedPhones.length === 0) {
    errors.push("Phone numbers appear to be removed from content");
  }

  // 6. Check word count
  const originalWordCount = countWords(original);
  const optimizedWordCount = countWords(optimized);

  if (optimizedWordCount < 200) {
    errors.push(
      `Content too short: ${optimizedWordCount} words (minimum 200 recommended)`
    );
  } else if (optimizedWordCount > 600) {
    warnings.push(
      `Content may still be too long: ${optimizedWordCount} words (target ~400)`
    );
  }

  // Word count reduction check
  if (optimizedWordCount > originalWordCount * 1.2) {
    warnings.push(
      `Content expanded instead of reduced: ${originalWordCount} -> ${optimizedWordCount} words`
    );
  }

  // 7. Check street address if provided
  if (clinic.streetAddress) {
    // Check if street number is present (first part of address)
    const streetNumber = clinic.streetAddress.match(/^\d+/)?.[0];
    if (streetNumber && !optimized.includes(streetNumber)) {
      warnings.push("Street address may not be fully visible");
    }
  }

  // 8. Check for hallucination indicators (new addresses/phones not in original)
  const newPhones = optimizedPhones.filter((p) => {
    const digits = p.replace(/\D/g, "");
    return !originalPhones.some(
      (op) => op.replace(/\D/g, "") === digits
    );
  });
  if (newPhones.length > 0) {
    errors.push(`New phone number detected that wasn't in original: ${newPhones[0]}`);
  }

  // Determine if manual review is required
  const requiresManualReview = errors.length > 0 || warnings.length > 2;

  return {
    passed: errors.length === 0,
    warnings,
    errors,
    requiresManualReview,
  };
}

/**
 * Parse and validate AI response JSON
 */
export interface OptimizationResponse {
  optimizedContent: string;
  faqs: Array<{ question: string; answer: string }>;
  keywordsIntegrated: string[];
  changesSummary: string;
}

export function parseOptimizationResponse(
  response: string
): OptimizationResponse | null {
  try {
    // Try to extract JSON from the response
    // Sometimes AI includes text before/after JSON
    let jsonStr = response.trim();

    // If response starts with text, try to find JSON
    const jsonStart = response.indexOf("{");
    const jsonEnd = response.lastIndexOf("}");

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonStr = response.slice(jsonStart, jsonEnd + 1);
    }

    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (
      typeof parsed.optimizedContent !== "string" ||
      !Array.isArray(parsed.faqs) ||
      !Array.isArray(parsed.keywordsIntegrated)
    ) {
      return null;
    }

    // Validate FAQ structure
    for (const faq of parsed.faqs) {
      if (
        typeof faq.question !== "string" ||
        typeof faq.answer !== "string"
      ) {
        return null;
      }
    }

    return {
      optimizedContent: parsed.optimizedContent,
      faqs: parsed.faqs,
      keywordsIntegrated: parsed.keywordsIntegrated,
      changesSummary: parsed.changesSummary || "",
    };
  } catch {
    return null;
  }
}

/**
 * Format review keywords for prompt
 */
export function formatKeywordsForPrompt(
  keywords: Array<{ keyword: string; count: number }> | null | undefined,
  maxKeywords: number = 10
): string {
  if (!keywords || keywords.length === 0) {
    return "No review keywords available for this clinic.";
  }

  // Sort by count descending and take top N
  const sorted = [...keywords]
    .sort((a, b) => b.count - a.count)
    .slice(0, maxKeywords);

  return sorted
    .map((k) => `- "${k.keyword}" (mentioned ${k.count} times by patients)`)
    .join("\n");
}
