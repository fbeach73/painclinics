"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const US_STATES = [
  { value: "", label: "None (general guide)" },
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
];

interface FAQ {
  question: string;
  answer: string;
}

interface GuideFormData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  stateAbbreviation: string;
  status: string;
  faqs: FAQ[];
  aboutTopics: string[];
}

interface GuideFormProps {
  initialData?: Partial<GuideFormData> & { id: string };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function GuideForm({ initialData }: GuideFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    initialData?.metaDescription || ""
  );
  const [stateAbbreviation, setStateAbbreviation] = useState(
    initialData?.stateAbbreviation || ""
  );
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [faqs, setFaqs] = useState<FAQ[]>(
    (initialData?.faqs as FAQ[] | undefined) || []
  );
  const [aboutTopicsText, setAboutTopicsText] = useState(
    ((initialData?.aboutTopics as string[] | undefined) || []).join(", ")
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData?.slug);

  async function handleGenerate() {
    if (!stateAbbreviation || stateAbbreviation === "none") {
      setError("Select a state first to generate content");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/guides/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateAbbreviation }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setTitle(data.title);
      setSlug(data.slug);
      setContent(data.content);
      setExcerpt(data.excerpt);
      setMetaTitle(data.metaTitle);
      setMetaDescription(data.metaDescription);
      setAboutTopicsText((data.aboutTopics || []).join(", "));
      setFaqs(data.faqs || []);
      setSlugManuallyEdited(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  function addFaq() {
    setFaqs([...faqs, { question: "", answer: "" }]);
  }

  function updateFaq(index: number, field: "question" | "answer", value: string) {
    const updated = [...faqs];
    const existing = updated[index]!;
    updated[index] = { question: existing.question, answer: existing.answer, [field]: value };
    setFaqs(updated);
  }

  function removeFaq(index: number) {
    setFaqs(faqs.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const aboutTopics = aboutTopicsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const validFaqs = faqs.filter((f) => f.question && f.answer);

    const body = {
      title,
      slug,
      content,
      excerpt,
      metaTitle,
      metaDescription,
      stateAbbreviation: stateAbbreviation || null,
      status,
      faqs: validFaqs.length > 0 ? validFaqs : null,
      aboutTopics: aboutTopics.length > 0 ? aboutTopics : null,
    };

    try {
      const url = isEditing
        ? `/api/admin/guides/${initialData.id}`
        : "/api/admin/guides";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save guide");
      }

      const data = await res.json();

      if (isEditing) {
        router.refresh();
      } else {
        router.push(`/admin/guides/${data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit Guide" : "New Guide"}
        </h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/guides")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Guide"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic fields */}
      <div className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">Basic Info</h2>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Guide to Pain Management in Texas"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugManuallyEdited(true);
            }}
            placeholder="pain-management-in-texas"
          />
          <p className="text-xs text-muted-foreground">
            URL: /guides/{slug || "..."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select
              value={stateAbbreviation}
              onValueChange={setStateAbbreviation}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state..." />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s.value || "none"} value={s.value || "none"}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* AI Generate */}
        <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Generate with AI</p>
              <p className="text-xs text-muted-foreground">
                Select a state above, then generate content, FAQs, and SEO fields via OpenRouter
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating || !stateAbbreviation || stateAbbreviation === "none"}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary shown on the guides index page"
            rows={2}
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">Content (HTML)</h2>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="<h2>Overview</h2><p>...</p>"
          rows={20}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Paste HTML content. Styled with Tailwind prose classes on the frontend.
        </p>
      </div>

      {/* SEO */}
      <div className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">SEO</h2>

        <div className="space-y-2">
          <Label htmlFor="metaTitle">Meta Title</Label>
          <Input
            id="metaTitle"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Pain Management in Texas: Complete Guide (2026)"
          />
          <p className="text-xs text-muted-foreground">
            {metaTitle.length}/60 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="metaDescription">Meta Description</Label>
          <Textarea
            id="metaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Everything you need to know about pain management in Texas..."
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            {metaDescription.length}/160 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aboutTopics">
            About Topics (comma-separated)
          </Label>
          <Input
            id="aboutTopics"
            value={aboutTopicsText}
            onChange={(e) => setAboutTopicsText(e.target.value)}
            placeholder="Chronic Pain, Pain Management, Opioid Policy"
          />
          <p className="text-xs text-muted-foreground">
            Used in MedicalWebPage structured data &quot;about&quot; field
          </p>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">FAQs</h2>
          <Button type="button" variant="outline" size="sm" onClick={addFaq}>
            <Plus className="h-4 w-4 mr-1" />
            Add FAQ
          </Button>
        </div>

        {faqs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No FAQs added. FAQs generate FAQPage structured data.
          </p>
        )}

        {faqs.map((faq, i) => (
          <div key={i} className="space-y-2 rounded border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  value={faq.question}
                  onChange={(e) => updateFaq(i, "question", e.target.value)}
                  placeholder="Question"
                />
                <Textarea
                  value={faq.answer}
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                  placeholder="Answer"
                  rows={2}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removeFaq(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom save */}
      <div className="flex justify-end gap-2 pb-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/guides")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? "Save Changes" : "Create Guide"}
        </Button>
      </div>
    </form>
  );
}
