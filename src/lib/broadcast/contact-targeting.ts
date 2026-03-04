import { getContactsForBroadcast, type ContactEmail } from "@/lib/contact-queries";

// ============================================
// Contact Merge Tags (client-safe)
// ============================================

export const CONTACT_MERGE_TAGS = {
  contact_name: { label: "Contact Name", example: "Jane Smith" },
  contact_email: { label: "Contact Email", example: "jane@example.com" },
  contact_phone: { label: "Contact Phone", example: "(555) 987-6543" },
} as const;

export type ContactMergeTagKey = keyof typeof CONTACT_MERGE_TAGS;

// ============================================
// Targeting
// ============================================

export async function getTargetContacts(
  audience: "contacts_all" | "contacts_users" | "contacts_leads",
  excludeUnsubscribed = true
): Promise<ContactEmail[]> {
  return getContactsForBroadcast(audience, excludeUnsubscribed);
}

export function getTargetContactCount(
  audience: "contacts_all" | "contacts_users" | "contacts_leads",
  excludeUnsubscribed = true
): Promise<number> {
  return getContactsForBroadcast(audience, excludeUnsubscribed).then(
    (contacts) => contacts.length
  );
}

// ============================================
// Merge Tag Substitution
// ============================================

export function substituteContactMergeTags(
  content: string,
  contact: ContactEmail
): string {
  const replacements: Record<string, string> = {
    "{{contact_name}}": contact.name || "",
    "{{contact_email}}": contact.email || "",
    "{{contact_phone}}": contact.phone || "",
  };

  let result = content;
  for (const [tag, value] of Object.entries(replacements)) {
    result = result.replaceAll(tag, value);
  }
  return result;
}

// ============================================
// Sample Data for Test Emails
// ============================================

export function getSampleContactData(): ContactEmail {
  return {
    contactId: "sample-contact-id",
    email: "jane@example.com",
    name: "Jane Smith",
    phone: "(555) 987-6543",
    userId: null,
    tags: ["user", "lead"],
    unsubscribeToken: "test-token",
  };
}
