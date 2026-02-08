/**
 * Contextual content blocks for filtered directory pages.
 * Each active filter can inject a relevant editorial paragraph below results.
 */

import type { DirectoryFilters } from "./filters";

interface ContentBlock {
  title: string;
  body: string;
}

/**
 * Specialty-specific content for contextual sections.
 */
const SPECIALTY_CONTENT: Record<string, ContentBlock> = {
  "injection-therapy": {
    title: "About Injection Therapy",
    body: "Injection therapy is one of the most common pain management treatments, involving corticosteroid injections, nerve blocks, and trigger point injections to provide targeted pain relief. These procedures are typically performed in-office and can offer relief lasting weeks to months. Look for clinics with experienced interventional pain specialists who use fluoroscopic or ultrasound guidance for precision.",
  },
  "physical-therapy": {
    title: "About Physical Therapy for Pain",
    body: "Physical therapy is a cornerstone of pain management, using exercises, stretches, and manual techniques to improve mobility, strengthen supporting muscles, and reduce pain. Many pain clinics offer integrated physical therapy alongside other treatments for a comprehensive approach. Ask about treatment plans tailored to your specific condition.",
  },
  "medication-management": {
    title: "About Medication Management",
    body: "Medication management for chronic pain involves careful selection, dosing, and monitoring of pain medications. Board-certified pain management physicians work with patients to find the most effective medication regimen while minimizing side effects and risks. This often includes a multi-modal approach combining different medication classes.",
  },
  "nerve-blocks": {
    title: "About Nerve Blocks",
    body: "Nerve blocks use injections of anesthetic or anti-inflammatory medication to interrupt pain signals from specific nerves. They can be diagnostic (to identify the pain source) or therapeutic (to provide relief). Common types include epidural nerve blocks, facet joint blocks, and sympathetic nerve blocks.",
  },
  "spinal-cord-stimulation": {
    title: "About Spinal Cord Stimulation",
    body: "Spinal cord stimulation (SCS) uses a small implanted device to deliver mild electrical pulses to the spinal cord, interrupting pain signals before they reach the brain. It's typically considered for patients with chronic pain who haven't responded to other treatments. Modern SCS systems offer rechargeable batteries, MRI compatibility, and customizable stimulation patterns.",
  },
  "regenerative-medicine": {
    title: "About Regenerative Medicine",
    body: "Regenerative medicine for pain management includes treatments like platelet-rich plasma (PRP) therapy and stem cell treatments that aim to repair damaged tissues and promote natural healing. These innovative approaches are used for joint pain, tendon injuries, and degenerative conditions. Look for clinics with experience in these specialized procedures.",
  },
  "acupuncture": {
    title: "About Acupuncture for Pain",
    body: "Acupuncture is an ancient practice increasingly supported by modern research for treating various pain conditions. It involves inserting thin needles at specific points to stimulate the body's natural pain-relieving mechanisms. Many pain management clinics now offer acupuncture as part of an integrative treatment approach.",
  },
  "chiropractic": {
    title: "About Chiropractic Care",
    body: "Chiropractic care focuses on diagnosing and treating musculoskeletal disorders, particularly those affecting the spine. Treatments include spinal adjustments, manipulation, and mobilization techniques. Many patients find chiropractic care effective for back pain, neck pain, and headaches, especially when combined with other pain management strategies.",
  },
  "massage-therapy": {
    title: "About Massage Therapy",
    body: "Therapeutic massage can help manage chronic pain by reducing muscle tension, improving circulation, and promoting relaxation. Techniques like deep tissue massage, myofascial release, and trigger point therapy are commonly used in pain management settings. Many clinics offer massage as part of a comprehensive treatment plan.",
  },
  "psychological-services": {
    title: "About Pain Psychology",
    body: "Pain psychology addresses the emotional and psychological aspects of chronic pain through techniques like cognitive behavioral therapy (CBT), mindfulness-based stress reduction, and biofeedback. These approaches help patients develop coping strategies, reduce pain-related anxiety, and improve quality of life alongside medical treatments.",
  },
};

/**
 * Insurance-related content blocks.
 */
const INSURANCE_CONTENT: Record<string, ContentBlock> = {
  medicare: {
    title: "Medicare Coverage for Pain Management",
    body: "Medicare covers many pain management treatments, including physician visits, certain injections, and some therapy services. Medicare Part B typically covers outpatient pain management, while Part A may cover inpatient procedures. Coverage specifics can vary, so confirm with the clinic and your Medicare plan before scheduling treatments.",
  },
  medicaid: {
    title: "Medicaid Coverage for Pain Management",
    body: "Medicaid coverage for pain management varies by state but generally includes physician visits, prescription medications, and some therapeutic procedures. Contact your state Medicaid office or the clinic directly to confirm which services are covered under your specific plan.",
  },
  "workers-comp": {
    title: "Workers' Compensation Pain Management",
    body: "Workers' compensation insurance covers pain management treatments for work-related injuries. Covered services typically include evaluations, physical therapy, injections, and other treatments prescribed by authorized physicians. Ensure the clinic is authorized by your workers' comp insurer before scheduling.",
  },
};

/**
 * Get contextual content blocks based on active filters.
 * Returns the most relevant content block (specialty first, then insurance).
 */
export function getContextualContent(
  filters: DirectoryFilters
): ContentBlock | null {
  // Priority: specialty content first
  for (const slug of filters.specialty) {
    const content = SPECIALTY_CONTENT[slug];
    if (content) return content;
  }

  // Then insurance content
  for (const slug of filters.insurance) {
    const content = INSURANCE_CONTENT[slug];
    if (content) return content;
  }

  return null;
}

/**
 * Get a general content block for unfiltered pages.
 */
export function getDefaultContent(
  locationName: string,
  clinicCount: number
): ContentBlock {
  return {
    title: `Pain Management in ${locationName}`,
    body: `Browse ${clinicCount} pain management clinics in ${locationName}. Our directory includes clinics offering a range of services from injection therapy and nerve blocks to physical therapy and regenerative medicine. Use the filters above to narrow your search by specialty, insurance acceptance, amenities, and more. Each listing includes ratings, reviews, hours, and contact information to help you find the right pain management provider.`,
  };
}
