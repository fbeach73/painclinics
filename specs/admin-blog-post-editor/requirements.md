# Requirements: Admin Blog Post Editor

## Overview

Add a full-featured blog post creation and editing interface to the admin panel. This allows administrators to create new blog posts directly in the system rather than migrating from WordPress, with modern WYSIWYG editing capabilities.

## Goals

1. **Content Creation**: Enable administrators to write and publish blog posts with rich formatting
2. **Media Management**: Support inline image uploads with automatic optimization
3. **Video Embeds**: Allow embedding YouTube videos via URL paste
4. **Categorization**: Assign posts to categories and tags (existing or new)
5. **Scheduling**: Schedule posts for future publication
6. **Draft Management**: Auto-save drafts to prevent data loss
7. **Preview**: Live preview of posts before publishing

## User Stories

### As an administrator, I want to:

- Create new blog posts with a rich text editor
- Upload images directly into the post content (drag/drop/paste)
- Have images automatically optimized (WebP conversion, resized)
- Embed YouTube videos by pasting URLs
- Set a featured image with alt text
- Assign categories and tags to posts
- Create new categories and tags inline while editing
- Save drafts automatically as I work
- Preview how the post will look when published
- Schedule posts for future publication dates
- Edit existing blog posts
- Delete blog posts

## Acceptance Criteria

### Editor Functionality
- [ ] TipTap WYSIWYG editor with formatting toolbar
- [ ] Bold, italic, underline text formatting
- [ ] Headings (H2, H3) support
- [ ] Bullet and numbered lists
- [ ] Blockquotes
- [ ] Links with URL input
- [ ] Image upload via drag-drop, paste, or button
- [ ] YouTube embed via URL paste (auto-detects YouTube URLs)

### Image Handling
- [ ] Images converted to WebP format on upload
- [ ] Images resized to max 1920px width
- [ ] Images uploaded to Vercel Blob storage
- [ ] Featured image upload with preview
- [ ] Featured image alt text field

### Post Management
- [ ] Title field with auto-generated slug
- [ ] Manual slug editing option
- [ ] Excerpt field (auto-generated or manual)
- [ ] Meta title and description for SEO
- [ ] Category multi-select with "create new" option
- [ ] Tag multi-select with "create new" option
- [ ] Status: Draft, Published, Archived
- [ ] Publish date/time picker for scheduling

### Draft & Preview
- [ ] Auto-save drafts every 3 seconds after changes
- [ ] Visual save status indicator (Saved/Saving/Unsaved)
- [ ] Toggle between Edit and Preview modes
- [ ] Preview renders with actual blog styling

### Admin Pages
- [ ] Blog posts list page with search and filters
- [ ] Filter by status (All/Draft/Published/Archived)
- [ ] New post page
- [ ] Edit post page
- [ ] Delete post with confirmation

## Dependencies

- Existing blog schema (blogPosts, blogCategories, blogTags tables)
- Existing storage system (src/lib/storage.ts)
- Admin authentication (requireAdmin)
- shadcn/ui component library

## Out of Scope

- Revision history / version control
- Multiple authors / author assignment
- Comment management
- Bulk post operations
- Post duplication
