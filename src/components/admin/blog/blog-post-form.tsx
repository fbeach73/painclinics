"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, Edit2, Save, Loader2, Trash2, Wand2, ImageIcon } from "lucide-react";
import {
  TiptapEditor,
  CategoryTagSelector,
  FeaturedImageUpload,
  PublishSettings,
  AutoSaveIndicator,
  PostPreview,
  type PostStatus,
  type SaveStatus,
} from "@/components/admin/blog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const BLOG_IMAGE_PRESETS = [
  {
    label: "Featured: Clinical / Medical",
    prompt:
      "A warm, cinematic photograph of a modern pain management clinic interior. Clean medical equipment, a consultation desk, and soft natural lighting. Professional and approachable. No faces, no text, no logos. Photorealistic editorial photography, 16:9 aspect ratio.",
  },
  {
    label: "Inline: Treatment / Procedure",
    prompt:
      "A realistic close-up photograph of a pain management procedure in progress: a doctor performing a fluoroscopy-guided spinal injection on a patient lying on a treatment table. Clinical blue drapes, modern medical equipment, bright overhead lighting. No faces visible, focus on the procedure. No text, no logos. Photorealistic medical photography, 16:9 ratio.",
  },
  {
    label: "Inline: Doctor Consultation",
    prompt:
      "A warm photograph of a pain management doctor in a white coat having a reassuring consultation with a patient in a modern clinic office. They are reviewing results on a tablet together. Natural lighting, professional but approachable. No text, no logos. Photorealistic editorial photography, 16:9 ratio.",
  },
  {
    label: "Inline: Medical Equipment",
    prompt:
      "A realistic overhead photograph of a doctor's desk with a prescription pad, a stethoscope, and medical documents fanned out. Warm wood desk surface, soft natural light from a window. No people, no faces. No text readable on documents. Photorealistic still life photography, 16:9 ratio.",
  },
  {
    label: "Inline: Patient Exercise / Rehab",
    prompt:
      "A bright photograph of a patient doing physical therapy exercises with a therapist in a modern rehabilitation clinic. Focus on the exercise movement, natural lighting, clean gym-like environment. No text, no logos. Photorealistic editorial photography, 16:9 ratio.",
  },
] as const;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface PostData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
  authorName: string;
  status: PostStatus;
  publishedAt: Date | null;
  categoryIds: string[];
  tagIds: string[];
}

interface BlogPostFormProps {
  post?: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    featuredImageUrl: string | null;
    featuredImageAlt: string | null;
    authorName: string | null;
    status: "draft" | "published" | "archived";
    publishedAt: Date | null;
    postCategories: Array<{ category: Category }>;
    postTags: Array<{ tag: Tag }>;
  };
  categories: Category[];
  tags: Tag[];
}

const defaultPostData: PostData = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  metaTitle: "",
  metaDescription: "",
  featuredImageUrl: null,
  featuredImageAlt: "",
  authorName: "",
  status: "draft",
  publishedAt: null,
  categoryIds: [],
  tagIds: [],
};

export function BlogPostForm({ post, categories: initialCategories, tags: initialTags }: BlogPostFormProps) {
  const router = useRouter();
  const isNewPost = !post;

  // Form data
  const [formData, setFormData] = useState<PostData>(() => {
    if (post) {
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || "",
        metaTitle: post.metaTitle || "",
        metaDescription: post.metaDescription || "",
        featuredImageUrl: post.featuredImageUrl,
        featuredImageAlt: post.featuredImageAlt || "",
        authorName: post.authorName || "",
        status: post.status,
        publishedAt: post.publishedAt,
        categoryIds: post.postCategories.map((pc) => pc.category.id),
        tagIds: post.postTags.map((pt) => pt.tag.id),
      };
    }
    return defaultPostData;
  });

  // Categories and tags lists (can be updated when new ones are created)
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [tags, setTags] = useState<Tag[]>(initialTags);

  // UI state
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Track if form has been modified
  const [hasChanges, setHasChanges] = useState(false);

  // AI Image generation state
  const [showImageGen, setShowImageGen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageResolution, setImageResolution] = useState<"1K" | "2K" | "4K">("1K");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageGenError, setImageGenError] = useState<string | null>(null);

  // Auto-save debounce timer
  useEffect(() => {
    if (!post?.id || !hasChanges) return;

    setSaveStatus("unsaved");
    const timer = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        await fetch("/api/admin/blog/autosave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: post.id,
            title: formData.title,
            content: formData.content,
          }),
        });
        setSaveStatus("saved");
        setLastSaved(new Date());
        setHasChanges(false);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setSaveStatus("error");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [formData.title, formData.content, post?.id, hasChanges]);

  // Update form data helper
  const updateFormData = useCallback(<K extends keyof PostData>(key: K, value: PostData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  // Image upload handler
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    const response = await fetch("/api/admin/blog/upload", {
      method: "POST",
      body: formDataUpload,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await response.json();
    return data.url;
  }, []);

  // Create new category
  const handleCreateCategory = useCallback(async (name: string): Promise<Category> => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const response = await fetch("/api/admin/blog/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });

    if (!response.ok) {
      throw new Error("Failed to create category");
    }

    const newCategory = await response.json();
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  }, []);

  // Create new tag
  const handleCreateTag = useCallback(async (name: string): Promise<Tag> => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const response = await fetch("/api/admin/blog/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });

    if (!response.ok) {
      throw new Error("Failed to create tag");
    }

    const newTag = await response.json();
    setTags((prev) => [...prev, newTag]);
    return newTag;
  }, []);

  // Handle featured image change
  const handleFeaturedImageChange = useCallback((url: string | null, alt: string) => {
    setFormData((prev) => ({
      ...prev,
      featuredImageUrl: url,
      featuredImageAlt: alt,
    }));
    setHasChanges(true);
  }, []);

  // AI Image generation
  async function handleGenerateImage() {
    const prompt = imagePrompt.trim();
    if (!prompt) {
      setImageGenError("Enter an image prompt first");
      return;
    }

    setIsGeneratingImage(true);
    setImageGenError(null);
    setGeneratedImageUrl(null);

    try {
      const res = await fetch("/api/admin/guides/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, resolution: imageResolution }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Image generation failed");
      }

      const data = await res.json();
      setGeneratedImageUrl(data.url);
    } catch (err) {
      setImageGenError(err instanceof Error ? err.message : "Image generation failed");
    } finally {
      setIsGeneratingImage(false);
    }
  }

  function handleSaveGeneratedAsFeatured() {
    if (generatedImageUrl) {
      setFormData((prev) => ({
        ...prev,
        featuredImageUrl: generatedImageUrl,
        featuredImageAlt: formData.title || "Blog post image",
      }));
      setHasChanges(true);
      setGeneratedImageUrl(null);
      setShowImageGen(false);
    }
  }

  function handleInsertGeneratedIntoContent() {
    if (generatedImageUrl) {
      setFormData((prev) => ({
        ...prev,
        content: prev.content + `<img src="${generatedImageUrl}" alt="AI generated image" />`,
      }));
      setHasChanges(true);
      setGeneratedImageUrl(null);
    }
  }

  // Save post (create or update)
  const handleSave = useCallback(async (publishNow = false) => {
    if (!formData.title.trim()) {
      alert("Title is required");
      return;
    }

    if (!formData.slug.trim()) {
      alert("Slug is required");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt || null,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        featuredImageUrl: formData.featuredImageUrl,
        featuredImageAlt: formData.featuredImageAlt || null,
        authorName: formData.authorName || null,
        status: publishNow ? "published" : formData.status,
        publishedAt: publishNow && !formData.publishedAt ? new Date() : formData.publishedAt,
        categoryIds: formData.categoryIds,
        tagIds: formData.tagIds,
      };

      if (isNewPost) {
        // Create new post
        const response = await fetch("/api/admin/blog/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create post");
        }

        const { id } = await response.json();
        router.push(`/admin/blog/${id}`);
      } else {
        // Update existing post
        const response = await fetch(`/api/admin/blog/posts/${post?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update post");
        }

        setSaveStatus("saved");
        setLastSaved(new Date());
        setHasChanges(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert(error instanceof Error ? error.message : "Failed to save post");
    } finally {
      setIsSaving(false);
    }
  }, [formData, isNewPost, post?.id, router]);

  // Delete post
  const handleDelete = useCallback(async () => {
    if (!post?.id) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/blog/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete post");
      }

      router.push("/admin/blog");
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error instanceof Error ? error.message : "Failed to delete post");
      setIsDeleting(false);
    }
  }, [post?.id, router]);

  // Get selected categories and tags for preview
  const selectedCategories = useMemo(() => {
    return categories.filter((c) => formData.categoryIds.includes(c.id));
  }, [categories, formData.categoryIds]);

  const selectedTags = useMemo(() => {
    return tags.filter((t) => formData.tagIds.includes(t.id));
  }, [tags, formData.tagIds]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isNewPost ? "Create New Post" : "Edit Post"}
          </h1>
          {!isNewPost && (
            <div className="mt-1">
              <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isNewPost && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete post?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the post
                    and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              "Publish"
            )}
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
        <TabsList>
          <TabsTrigger value="edit" className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                  placeholder="Enter post title"
                  className="text-lg font-medium"
                />
              </div>

              {/* Editor */}
              <div className="space-y-2">
                <Label>Content</Label>
                <TiptapEditor
                  content={formData.content}
                  onChange={(html) => updateFormData("content", html)}
                  onImageUpload={handleImageUpload}
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => updateFormData("excerpt", e.target.value)}
                  placeholder="Brief summary for post lists and SEO..."
                  rows={3}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publish Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Publish</CardTitle>
                </CardHeader>
                <CardContent>
                  <PublishSettings
                    status={formData.status}
                    slug={formData.slug}
                    publishedAt={formData.publishedAt}
                    onStatusChange={(status) => updateFormData("status", status)}
                    onSlugChange={(slug) => updateFormData("slug", slug)}
                    onPublishedAtChange={(date) => updateFormData("publishedAt", date)}
                    title={formData.title}
                    isNewPost={isNewPost}
                  />
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryTagSelector
                    label="Categories"
                    items={categories}
                    selected={formData.categoryIds}
                    onChange={(ids) => updateFormData("categoryIds", ids)}
                    onCreate={handleCreateCategory}
                    placeholder="Add categories"
                  />
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryTagSelector
                    label="Tags"
                    items={tags}
                    selected={formData.tagIds}
                    onChange={(ids) => updateFormData("tagIds", ids)}
                    onCreate={handleCreateTag}
                    placeholder="Add tags"
                  />
                </CardContent>
              </Card>

              {/* Featured Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Featured Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FeaturedImageUpload
                    imageUrl={formData.featuredImageUrl}
                    imageAlt={formData.featuredImageAlt}
                    onImageChange={handleFeaturedImageChange}
                    onUpload={handleImageUpload}
                  />

                  {/* AI Image Generation */}
                  <div className="border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImageGen(!showImageGen)}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      {showImageGen ? "Hide AI Image Generator" : "Generate with AI"}
                    </Button>

                    {showImageGen && (
                      <div className="mt-4 space-y-3 rounded-md border border-dashed border-primary/40 bg-primary/5 dark:bg-primary/10 p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="blogImagePrompt" className="text-sm">Image Prompt</Label>
                            <Select
                              value=""
                              onValueChange={(v) => {
                                const preset = BLOG_IMAGE_PRESETS[parseInt(v)];
                                if (preset) setImagePrompt(preset.prompt);
                              }}
                            >
                              <SelectTrigger className="w-[200px] h-8 text-xs">
                                <SelectValue placeholder="Load preset..." />
                              </SelectTrigger>
                              <SelectContent>
                                {BLOG_IMAGE_PRESETS.map((preset, i) => (
                                  <SelectItem key={i} value={String(i)} className="text-xs">
                                    {preset.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Textarea
                            id="blogImagePrompt"
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            placeholder="Describe the image to generate..."
                            rows={3}
                            className="text-sm"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">Resolution</Label>
                            <Select value={imageResolution} onValueChange={(v: "1K" | "2K" | "4K") => setImageResolution(v)}>
                              <SelectTrigger className="w-[80px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1K">1K</SelectItem>
                                <SelectItem value="2K">2K</SelectItem>
                                <SelectItem value="4K">4K</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImage || !imagePrompt.trim()}
                          >
                            {isGeneratingImage ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ImageIcon className="h-4 w-4 mr-2" />
                            )}
                            {isGeneratingImage ? "Generating..." : "Generate"}
                          </Button>
                        </div>

                        {imageGenError && (
                          <p className="text-sm text-destructive">{imageGenError}</p>
                        )}

                        {generatedImageUrl && (
                          <div className="space-y-3">
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                              <Image
                                src={generatedImageUrl}
                                alt="AI generated image"
                                fill
                                className="object-cover"
                                sizes="(max-width: 400px) 100vw, 400px"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveGeneratedAsFeatured}
                              >
                                Save as Featured
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleInsertGeneratedIntoContent}
                              >
                                Insert into Content
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SEO */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={formData.metaTitle}
                      onChange={(e) => updateFormData("metaTitle", e.target.value)}
                      placeholder="SEO title (defaults to post title)"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.metaTitle.length}/60 characters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) => updateFormData("metaDescription", e.target.value)}
                      placeholder="Brief description for search engines..."
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.metaDescription.length}/160 characters
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Author */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Author</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="authorName">Author Name</Label>
                    <Input
                      id="authorName"
                      value={formData.authorName}
                      onChange={(e) => updateFormData("authorName", e.target.value)}
                      placeholder="Author name"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <PostPreview
            title={formData.title}
            content={formData.content}
            featuredImageUrl={formData.featuredImageUrl}
            featuredImageAlt={formData.featuredImageAlt}
            authorName={formData.authorName}
            publishedAt={formData.publishedAt}
            categories={selectedCategories}
            tags={selectedTags}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
