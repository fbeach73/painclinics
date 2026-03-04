// Client-safe contact merge tag constants (no server imports)

export const CONTACT_MERGE_TAGS = {
  contact_name: { label: "Contact Name", example: "Jane Smith" },
  contact_email: { label: "Contact Email", example: "jane@example.com" },
  contact_phone: { label: "Contact Phone", example: "(555) 987-6543" },
} as const;

export type ContactMergeTagKey = keyof typeof CONTACT_MERGE_TAGS;
