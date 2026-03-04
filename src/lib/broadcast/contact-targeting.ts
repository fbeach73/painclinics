import { getContactsForBroadcast, type ContactEmail } from "@/lib/contact-queries";

// Re-export client-safe merge tag constants
export { CONTACT_MERGE_TAGS, type ContactMergeTagKey } from "./contact-merge-tags";

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
