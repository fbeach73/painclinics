# Implementation Plan: Admin Blog Post Editor

## Overview

Build a comprehensive blog post editor in the admin panel using TipTap WYSIWYG editor, with image uploads (WebP conversion + resize), auto-save drafts, live preview, and scheduled publishing. Integrates with existing blog schema and storage system.

---

## Phase 1: Dependencies & Utilities

Set up required packages and create image processing utility.

### Tasks

- [x] Install TipTap editor packages
- [x] Install Sharp image processing library
- [x] Add shadcn calendar and popover components
- [x] Create image processing utility for WebP conversion and resize

### Technical Details

**TipTap Installation:**
```bash
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-youtube @tiptap/extension-placeholder @tiptap/extension-underline
```

**Sharp Installation:**
```bash
pnpm add sharp
pnpm add -D @types/sharp
```

**shadcn Components:**
```bash
pnpm dlx shadcn@latest add calendar popover
```

**Image Processing Utility** (`src/lib/blog/image-processing.ts`):
```typescript
import sharp from "sharp";

export async function processImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

export function generateImageFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomSuffix}.webp`;
}
```

---

## Phase 2: Database Mutations

Create functions for creating, updating, and deleting blog posts, categories, and tags.

### Tasks

- [x] Create blog mutations file with CRUD operations
- [x] Add admin-specific query functions to blog-queries.ts

### Technical Details

**New File** (`src/lib/blog/blog-mutations.ts`):

```typescript
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

interface CreateBlogPostInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  authorName?: string;
  status: "draft" | "published" | "archived";
  publishedAt?: Date;
}

export async function createBlogPost(input: CreateBlogPostInput) {
  const id = createId();
  await db.insert(schema.blogPosts).values({
    id,
    ...input,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function updateBlogPost(id: string, input: Partial<CreateBlogPostInput>) {
  await db
    .update(schema.blogPosts)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.blogPosts.id, id));
}

export async function deleteBlogPost(id: string) {
  // Delete associations first (cascade should handle this, but being explicit)
  await db.delete(schema.blogPostCategories).where(eq(schema.blogPostCategories.postId, id));
  await db.delete(schema.blogPostTags).where(eq(schema.blogPostTags.postId, id));
  await db.delete(schema.blogPosts).where(eq(schema.blogPosts.id, id));
}

export async function setPostCategories(postId: string, categoryIds: string[]) {
  await db.delete(schema.blogPostCategories).where(eq(schema.blogPostCategories.postId, postId));
  if (categoryIds.length > 0) {
    await db.insert(schema.blogPostCategories).values(
      categoryIds.map((categoryId) => ({ postId, categoryId }))
    );
  }
}

export async function setPostTags(postId: string, tagIds: string[]) {
  await db.delete(schema.blogPostTags).where(eq(schema.blogPostTags.postId, postId));
  if (tagIds.length > 0) {
    await db.insert(schema.blogPostTags).values(
      tagIds.map((tagId) => ({ postId, tagId }))
    );
  }
}

export async function createCategory(name: string, slug: string) {
  const id = createId();
  await db.insert(schema.blogCategories).values({ id, name, slug });
  return { id, name, slug };
}

export async function createTag(name: string, slug: string) {
  const id = createId();
  await db.insert(schema.blogTags).values({ id, name, slug });
  return { id, name, slug };
}
```

**Modify** (`src/lib/blog/blog-queries.ts`) - Add these functions:

```typescript
export async function getBlogPostById(id: string) {
  return db.query.blogPosts.findFirst({
    where: eq(schema.blogPosts.id, id),
    with: {
      postCategories: { with: { category: true } },
      postTags: { with: { tag: true } },
    },
  });
}

export async function getBlogPostsAdmin(options: {
  page?: number;
  limit?: number;
  status?: "draft" | "published" | "archived" | "all";
  search?: string;
} = {}) {
  const { page = 1, limit = 50, status = "all", search } = options;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status !== "all") {
    conditions.push(eq(schema.blogPosts.status, status));
  }
  if (search) {
    conditions.push(sql`${schema.blogPosts.title} ILIKE ${`%${search}%`}`);
  }

  const posts = await db.query.blogPosts.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: desc(schema.blogPosts.updatedAt),
    limit,
    offset,
    with: {
      postCategories: { with: { category: true } },
      postTags: { with: { tag: true } },
    },
  });

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.blogPosts)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return { posts, total: Number(countResult[0]?.count || 0) };
}
```

---

## Phase 3: API Endpoints

Create REST API endpoints for blog post CRUD, categories, tags, and image uploads.

### Tasks

- [x] Create blog posts list and create endpoint (`/api/admin/blog/posts`)
- [x] Create single post get/update/delete endpoint (`/api/admin/blog/posts/[postId]`)
- [x] Create categories list and create endpoint (`/api/admin/blog/categories`)
- [x] Create tags list and create endpoint (`/api/admin/blog/tags`)
- [x] Create image upload endpoint with processing (`/api/admin/blog/upload`)
- [x] Create auto-save endpoint (`/api/admin/blog/autosave`)

### Technical Details

**Posts API** (`src/app/api/admin/blog/posts/route.ts`):
```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getBlogPostsAdmin } from "@/lib/blog/blog-queries";
import { createBlogPost, setPostCategories, setPostTags } from "@/lib/blog/blog-mutations";

export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const status = searchParams.get("status") as "draft" | "published" | "archived" | "all" || "all";
  const search = searchParams.get("search") || undefined;

  const result = await getBlogPostsAdmin({ page, status, search });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  const body = await request.json();
  const { categoryIds, tagIds, ...postData } = body;

  const postId = await createBlogPost(postData);
  if (categoryIds?.length) await setPostCategories(postId, categoryIds);
  if (tagIds?.length) await setPostTags(postId, tagIds);

  return NextResponse.json({ id: postId }, { status: 201 });
}
```

**Single Post API** (`src/app/api/admin/blog/posts/[postId]/route.ts`):
```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  // ... get post by ID
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  // ... update post
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  // ... delete post
}
```

**Image Upload API** (`src/app/api/admin/blog/upload/route.ts`):
```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { processImage, generateImageFilename } from "@/lib/blog/image-processing";
import { upload } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const processed = await processImage(buffer);
  const filename = generateImageFilename(file.name);

  const result = await upload(processed, filename, "blog");
  return NextResponse.json({ url: result.url });
}
```

**Categories API** (`src/app/api/admin/blog/categories/route.ts`):
- GET: Return `getAllCategories()`
- POST: Create new category with name/slug validation

**Tags API** (`src/app/api/admin/blog/tags/route.ts`):
- GET: Return `getAllTags()`
- POST: Create new tag with name/slug validation

**Auto-save API** (`src/app/api/admin/blog/autosave/route.ts`):
- POST: Accepts `{ postId, content, title }` and calls `updateBlogPost`

---

## Phase 4: Editor Components [complex]

Build the TipTap editor and supporting form components.

### Tasks

- [x] Create TipTap editor component with extensions
  - [x] Configure StarterKit, Image, Link, YouTube, Placeholder, Underline extensions
  - [x] Implement image upload handler (drag/drop/paste)
  - [x] Implement YouTube URL auto-detection
- [x] Create editor toolbar component
- [x] Create category/tag multi-select component with inline creation
- [x] Create featured image upload component
- [x] Create publish settings panel (status, date picker, slug)
- [x] Create auto-save indicator component
- [x] Create post preview component

### Technical Details

**TipTap Editor** (`src/components/admin/blog/tiptap-editor.tsx`):
```typescript
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { TiptapToolbar } from "./tiptap-toolbar";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload: (file: File) => Promise<string>;
}

export function TiptapEditor({ content, onChange, onImageUpload }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Youtube.configure({ width: 640, height: 360 }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      handleDrop: (view, event, slice, moved) => {
        // Handle image drop
      },
      handlePaste: (view, event) => {
        // Handle image paste and YouTube URL paste
      },
    },
  });

  return (
    <div className="border rounded-md">
      <TiptapToolbar editor={editor} onImageUpload={onImageUpload} />
      <EditorContent editor={editor} className="prose max-w-none p-4 min-h-[400px]" />
    </div>
  );
}
```

**Editor Toolbar** (`src/components/admin/blog/tiptap-toolbar.tsx`):
- Toggle buttons for: Bold, Italic, Underline, H2, H3, BulletList, OrderedList, Blockquote
- Insert buttons for: Link (dialog), Image (file input), YouTube (URL dialog)
- Uses shadcn Toggle, Button, Popover components

**Category/Tag Selector** (`src/components/admin/blog/category-tag-selector.tsx`):
- Multi-select dropdown with checkboxes
- Search/filter input
- "Create new" button that opens inline input
- Selected items displayed as badges
- Props: `items`, `selected`, `onChange`, `onCreate`, `label`

**Featured Image Upload** (`src/components/admin/blog/featured-image-upload.tsx`):
- Dropzone with dashed border
- Image preview when uploaded
- Remove button
- Alt text input field below preview
- Uses same upload endpoint

**Publish Settings** (`src/components/admin/blog/publish-settings.tsx`):
- Status select: Draft | Published | Archived
- Date/time picker for `publishedAt` (using shadcn Calendar + time input)
- Slug input with auto-generate toggle
- "Publish" and "Save Draft" buttons

**Auto-save Indicator** (`src/components/admin/blog/auto-save-indicator.tsx`):
```typescript
interface AutoSaveIndicatorProps {
  status: "saved" | "saving" | "unsaved";
}

export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  // Display: "All changes saved" | "Saving..." | "Unsaved changes"
  // With appropriate icon (CheckCircle, Loader2, AlertCircle)
}
```

**Post Preview** (`src/components/admin/blog/post-preview.tsx`):
- Receives post data as props
- Renders with same styling as public blog post
- Uses prose typography classes

---

## Phase 5: Main Form & Admin Pages

Create the blog post form wrapper and admin pages.

### Tasks

- [x] Create main blog post form component (combines all editor components)
- [x] Implement auto-save logic with 3-second debounce
- [x] Create blog posts list page with filters and search
- [x] Create blog post list component (client-side filtering)
- [x] Create new post page
- [x] Create edit post page with client component

### Technical Details

**Blog Post Form** (`src/components/admin/blog/blog-post-form.tsx`):

Layout structure:
```
+--------------------------------------------------+
| [Title Input - full width]                        |
+--------------------------------+-----------------+
|                                | Status & Publish|
|   TipTap Editor                | Date/Time       |
|   (flex-1)                     +-----------------+
|                                | Categories      |
|                                | [multi-select]  |
|                                +-----------------+
|                                | Tags            |
|                                | [multi-select]  |
|                                +-----------------+
|                                | Featured Image  |
|                                | [dropzone]      |
|                                +-----------------+
|                                | SEO             |
|                                | Meta title      |
|                                | Meta desc       |
|                                | Slug            |
+--------------------------------+-----------------+
| [Edit | Preview toggle]                          |
+--------------------------------------------------+
```

Auto-save implementation:
```typescript
const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
const [formData, setFormData] = useState(initialData);

// Debounced auto-save
useEffect(() => {
  if (!postId) return; // Don't auto-save new posts

  setSaveStatus("unsaved");
  const timer = setTimeout(async () => {
    setSaveStatus("saving");
    await fetch(`/api/admin/blog/autosave`, {
      method: "POST",
      body: JSON.stringify({ postId, ...formData }),
    });
    setSaveStatus("saved");
  }, 3000);

  return () => clearTimeout(timer);
}, [formData, postId]);
```

**Blog Posts List Page** (`src/app/admin/blog/page.tsx`):
```typescript
import { getBlogPostsAdmin } from "@/lib/blog/blog-queries";
import { BlogPostList } from "@/components/admin/blog/blog-post-list";

export default async function AdminBlogPage() {
  const { posts, total } = await getBlogPostsAdmin();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <Button asChild><Link href="/admin/blog/new">New Post</Link></Button>
      </div>
      <BlogPostList initialPosts={posts} initialTotal={total} />
    </div>
  );
}
```

**Blog Post List Component** (`src/components/admin/blog/blog-post-list.tsx`):
- Status filter tabs: All | Draft | Published | Archived
- Search input with debounce
- Table columns: Title (link), Status (badge), Categories, Updated, Actions
- Delete with confirmation dialog
- Pagination

**New Post Page** (`src/app/admin/blog/new/page.tsx`):
```typescript
import { BlogPostForm } from "@/components/admin/blog/blog-post-form";
import { getAllCategories, getAllTags } from "@/lib/blog/blog-queries";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([getAllCategories(), getAllTags()]);
  return <BlogPostForm categories={categories} tags={tags} />;
}
```

**Edit Post Page** (`src/app/admin/blog/[postId]/page.tsx`):
```typescript
import { notFound } from "next/navigation";
import { getBlogPostById, getAllCategories, getAllTags } from "@/lib/blog/blog-queries";
import { EditPostClient } from "./edit-post-client";

export default async function EditPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const [post, categories, tags] = await Promise.all([
    getBlogPostById(postId),
    getAllCategories(),
    getAllTags(),
  ]);

  if (!post) notFound();

  return <EditPostClient post={post} categories={categories} tags={tags} />;
}
```

---

## Phase 6: Navigation & Polish

Update admin sidebar and ensure scheduled publishing works correctly.

### Tasks

- [x] Add "Blog Posts" link to admin sidebar
- [x] Add scheduled post display logic (show "Scheduled" status in admin)
- [x] Ensure public blog only shows published posts with past publishedAt dates

### Technical Details

**Update Admin Sidebar** (`src/components/admin/admin-sidebar.tsx`):

Add to navItems array after "Blog Migration":
```typescript
import { PenSquare } from "lucide-react";

const navItems = [
  // ... existing items
  { href: "/admin/blog/migration", label: "Blog Migration", icon: FileText },
  { href: "/admin/blog", label: "Blog Posts", icon: PenSquare },  // NEW
  // ... rest of items
];
```

**Scheduled Post Logic:**

In admin list, show status as "Scheduled" when:
```typescript
const getDisplayStatus = (post) => {
  if (post.status === "draft" && post.publishedAt && new Date(post.publishedAt) > new Date()) {
    return "scheduled";
  }
  return post.status;
};
```

Public blog query already filters by `status === "published"`. Optionally add date check:
```typescript
// In getBlogPosts(), add condition:
conditions.push(sql`${schema.blogPosts.publishedAt} <= NOW()`);
```

---

## File Summary

### New Files (19)

```
src/lib/blog/
├── blog-mutations.ts
└── image-processing.ts

src/app/api/admin/blog/
├── posts/
│   ├── route.ts
│   └── [postId]/route.ts
├── categories/route.ts
├── tags/route.ts
├── upload/route.ts
└── autosave/route.ts

src/app/admin/blog/
├── page.tsx
├── new/page.tsx
└── [postId]/
    ├── page.tsx
    └── edit-post-client.tsx

src/components/admin/blog/
├── blog-post-list.tsx
├── blog-post-form.tsx
├── tiptap-editor.tsx
├── tiptap-toolbar.tsx
├── category-tag-selector.tsx
├── featured-image-upload.tsx
├── publish-settings.tsx
├── auto-save-indicator.tsx
└── post-preview.tsx
```

### Modified Files (2)

```
src/lib/blog/blog-queries.ts (add getBlogPostById, getBlogPostsAdmin)
src/components/admin/admin-sidebar.tsx (add Blog Posts nav item)
```
