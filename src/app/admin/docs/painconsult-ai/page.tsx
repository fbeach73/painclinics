import Link from "next/link";
import {
  MessageSquareHeart,
  ArrowLeft,
  Bot,
  Mail,
  CreditCard,
  Database,
  Clock,
  Users,
  Workflow,
  Shield,
  FileText,
  Globe,
  Zap,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PainConsultAIDocs() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/docs"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Docs
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <MessageSquareHeart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              PainConsult AI
            </h1>
            <p className="text-muted-foreground">
              Complete implementation guide for the AI pain consultation funnel
            </p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300">
            PainConsult AI is a free AI-powered pain consultation chat that captures leads,
            matches clinics from our database, and upsells a $19.99 personalized pain management PDF.
            It serves two purposes: <strong>lead generation</strong> (qualified pain patients with
            condition + zip + email + age) and <strong>direct revenue</strong> (PDF sales).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 not-prose">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Free</div>
              <div className="text-sm text-muted-foreground">AI Consultation</div>
              <div className="text-xs text-muted-foreground mt-1">Captures leads</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">$19.99</div>
              <div className="text-sm text-muted-foreground">PDF Pain Plan</div>
              <div className="text-xs text-muted-foreground mt-1">One-time Stripe payment</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">$$$$</div>
              <div className="text-sm text-muted-foreground">Lead Routing</div>
              <div className="text-xs text-muted-foreground mt-1">Sell leads to clinics</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-purple-500" />
            User Flow
          </CardTitle>
          <CardDescription>The complete funnel from first click to revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                step: "1",
                title: "AI Triage Chat",
                desc: "User describes pain → AI asks ~7 structured questions (location, duration, severity, symptoms, treatments tried, insurance)",
                badge: "Free",
                badgeColor: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
              },
              {
                step: "2",
                title: "Guidance Summary",
                desc: "AI delivers a short assessment (likely causes, one self-care tip, specialist type). Teases the full report.",
                badge: "Free",
                badgeColor: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
              },
              {
                step: "3",
                title: "Zip + Email Capture",
                desc: 'AI mentions "zip code" → structured form appears. User enters zip code + email.',
                badge: "Lead Capture",
                badgeColor: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
              },
              {
                step: "4",
                title: "Name + Age Capture",
                desc: "Second form: first name, last name, age (optional). Saved to contacts table.",
                badge: "Lead Capture",
                badgeColor: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
              },
              {
                step: "5",
                title: "Clinic Matching",
                desc: "Queries clinics DB by zip code. Shows matched clinics with ratings, links to clinic pages.",
                badge: "Lead Routing",
                badgeColor: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
              },
              {
                step: "6",
                title: "PDF Upsell",
                desc: "$19.99 personalized pain management plan. Stripe Checkout → AI generates comprehensive plan → emailed as HTML.",
                badge: "$19.99",
                badgeColor: "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-4 rounded-lg border border-border p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </span>
                    <Badge className={item.badgeColor} variant="secondary">
                      {item.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat UI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            Chat Interface
          </CardTitle>
          <CardDescription>Two surfaces, same API backend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Full Page</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>URL:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">/consult</code></p>
                <p><strong>Layout:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">src/app/consult/layout.tsx</code></p>
                <p><strong>Component:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">src/app/consult/consult-chat.tsx</code></p>
                <p><strong>CSS:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">src/app/consult/consult.css</code></p>
                <p>Standalone dark theme, own fonts (Playfair Display + DM Sans), no site header/footer</p>
              </div>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Floating Widget</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>Location:</strong> Bottom-right on all pages</p>
                <p><strong>Component:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/consult/chat-widget.tsx</code></p>
                <p><strong>Loader:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/consult/chat-widget-lazy.tsx</code></p>
                <p><strong>CSS:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/consult/chat-widget.css</code></p>
                <p>Dynamic import (ssr: false), scoped CSS with <code className="text-xs bg-muted px-1 py-0.5 rounded">cw-</code> prefix, 400x600px panel</p>
              </div>
            </div>
          </div>

          <h4 className="font-semibold text-gray-900 dark:text-white mt-6 mb-3">Chat Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {[
              "Streaming responses via Vercel AI SDK",
              "[Q]...[/Q] tags for styled question blocks",
              "[OPTIONS] → clickable single-select pills",
              "[MULTI-OPTIONS] → toggleable multi-select + Next button",
              "↩ Change answer link on last user message",
              "Body location chips for initial selection",
              "Typing indicator with bouncing dots",
              "Auto-scroll to typing dots on send",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-muted-foreground">
                <ChevronRight className="h-3 w-3 shrink-0 text-blue-500" />
                {feature}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            API Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-white">Endpoint</th>
                  <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-white">Method</th>
                  <th className="text-left py-2 font-semibold text-gray-900 dark:text-white">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  { endpoint: "/api/consult/chat", method: "POST", purpose: "Streaming AI chat via OpenRouter + Vercel AI SDK" },
                  { endpoint: "/api/consult/match-clinics", method: "POST", purpose: "Query clinics by zip (exact → 3-digit prefix fallback)" },
                  { endpoint: "/api/consult/save-contact", method: "POST", purpose: "Upsert contact with consult-user tag + metadata" },
                  { endpoint: "/api/consult/send-summary", method: "POST", purpose: "Send consultation summary email + save lead-clinic matches" },
                  { endpoint: "/api/consult/checkout", method: "POST", purpose: "Create Stripe Checkout Session ($19.99 one-time)" },
                  { endpoint: "/api/consult/generate-pdf", method: "POST", purpose: "AI generates comprehensive plan, emails as HTML" },
                  { endpoint: "/api/cron/consult-drip", method: "GET", purpose: "Daily drip email cron (Day 3 + Day 7)" },
                  { endpoint: "/api/admin/consult-leads/[matchId]/status", method: "PATCH", purpose: "Update lead-clinic match status" },
                ].map((route) => (
                  <tr key={route.endpoint} className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{route.endpoint}</code>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant="outline" className="text-xs">{route.method}</Badge>
                    </td>
                    <td className="py-2">{route.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Database */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-500" />
            Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">contacts table</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Consult leads are stored with tag <code className="text-xs bg-muted px-1 py-0.5 rounded">&quot;consult-user&quot;</code>
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Tags:</strong> [&quot;consult-user&quot;, &quot;pain-consult&quot;]</p>
              <p><strong>Metadata (jsonb):</strong></p>
              <ul className="ml-4 space-y-0.5">
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">zipCode</code> — user&apos;s zip</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">condition</code> — first user message (e.g., &quot;My pain is in my lower back&quot;)</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">age</code> — optional</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">consultDate</code> — ISO timestamp</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">consultSource</code> — &quot;painconsult-ai&quot;</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">drip3Sent</code> / <code className="text-xs bg-muted px-1 py-0.5 rounded">drip7Sent</code> — boolean flags for drip sequence</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">consult_lead_matches table</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Links leads to matched clinics with status tracking
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Columns:</strong> id, contactId, clinicId, condition, zipCode, status, notes, createdAt, updatedAt</p>
              <p><strong>Status values:</strong></p>
              <div className="flex gap-2 mt-1">
                {["matched", "contacted", "booked", "converted"].map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Requires <code className="bg-muted px-1 py-0.5 rounded">pnpm db:push</code> to create
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-red-500" />
            Email Sequence
          </CardTitle>
          <CardDescription>Automated via Mailgun + Vercel Cron</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                timing: "Immediate",
                name: "Consultation Summary",
                file: "consult-summary.tsx",
                desc: "Assessment recap + matched clinics + PDF upsell CTA",
                trigger: "After name/age submit + clinics load",
              },
              {
                timing: "Day 3",
                name: "Follow-up Check-in",
                file: "consult-followup-day3.tsx",
                desc: "\"How's your pain?\" + clinic finder CTA + soft PDF mention",
                trigger: "Cron: /api/cron/consult-drip (daily 2pm UTC)",
              },
              {
                timing: "Day 7",
                name: "PDF Upsell Push",
                file: "consult-followup-day7.tsx",
                desc: "\"Your personalized plan is ready\" + detailed plan preview + $19.99 CTA",
                trigger: "Cron: /api/cron/consult-drip (daily 2pm UTC)",
              },
              {
                timing: "On Purchase",
                name: "Pain Management Plan",
                file: "consult-pdf-plan.tsx",
                desc: "The $19.99 deliverable — AI-generated comprehensive plan (4000 tokens)",
                trigger: "After Stripe payment confirmed on /consult/success",
              },
            ].map((email) => (
              <div key={email.name} className="flex items-start gap-4 rounded-lg border border-border p-4">
                <div className="shrink-0">
                  <Badge
                    variant="outline"
                    className={
                      email.timing === "Immediate"
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700"
                        : email.timing === "On Purchase"
                          ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                          : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700"
                    }
                  >
                    {email.timing}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white">{email.name}</div>
                  <p className="text-sm text-muted-foreground">{email.desc}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>File: <code className="bg-muted px-1 py-0.5 rounded">src/emails/{email.file}</code></span>
                    <span>Trigger: {email.trigger}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stripe / Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-500" />
            Stripe Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">One-Time Payment ($19.99)</h4>
            <ul className="space-y-1">
              <li><strong>Client:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">src/lib/stripe.ts</code> (standalone, separate from Better Auth&apos;s subscription Stripe)</li>
              <li><strong>Checkout:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">POST /api/consult/checkout</code> → Stripe Checkout Session with <code className="text-xs bg-muted px-1 py-0.5 rounded">mode: &quot;payment&quot;</code></li>
              <li><strong>Product:</strong> Inline <code className="text-xs bg-muted px-1 py-0.5 rounded">price_data</code> (no pre-created Stripe product)</li>
              <li><strong>Success:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">/consult/success</code> — verifies payment, triggers PDF generation</li>
              <li><strong>No auth required</strong> — works for anonymous users</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">PDF Generation Flow</h4>
            <ol className="space-y-1 list-decimal ml-4">
              <li>User clicks &quot;Get Your Personalized Plan&quot; → <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/consult/checkout</code> creates Stripe session</li>
              <li>User pays on Stripe → redirected to <code className="text-xs bg-muted px-1 py-0.5 rounded">/consult/success?session_id=...</code></li>
              <li>Success page verifies payment → fires <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/consult/generate-pdf</code></li>
              <li>AI generates comprehensive plan via OpenRouter (maxTokens: 4000)</li>
              <li>Plan emailed to user as formatted HTML via Mailgun</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            System Prompt
          </CardTitle>
          <CardDescription>
            Located in <code className="text-xs bg-muted px-1 py-0.5 rounded">src/app/api/consult/chat/route.ts</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: "One question at a time", desc: "Never combines multiple questions" },
              { title: "Answer confirmation", desc: 'Echoes back selections: "Got it — you said **dull ache**"' },
              { title: "Short guidance format", desc: "4-6 paragraphs max. Detailed info reserved for paid PDF" },
              { title: "Red flag detection", desc: "Chest pain + shoulder pain → immediate 911 routing" },
              { title: "Zip code trigger", desc: 'Ends with "I\'ll need your zip code" to activate capture UI' },
              { title: "Max 600 tokens", desc: "Keeps responses focused and concise" },
            ].map((rule) => (
              <div key={rule.title} className="rounded-lg border border-border p-3">
                <div className="font-medium text-gray-900 dark:text-white">{rule.title}</div>
                <p className="text-xs text-muted-foreground">{rule.desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 p-3">
            <p className="text-amber-800 dark:text-amber-200 text-xs">
              <strong>Formatting tags:</strong> <code>[Q]...[/Q]</code> for questions,{" "}
              <code>[OPTIONS]</code> for single-select, <code>[MULTI-OPTIONS]</code> for multi-select.
              The UI parses these into interactive pill buttons.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Admin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-500" />
            Admin Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div className="space-y-2">
            <p>
              <strong>Page:</strong>{" "}
              <Link href="/admin/consult-leads" className="text-blue-600 dark:text-blue-400 hover:underline">
                /admin/consult-leads
              </Link>
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Table view of all consult leads (contacts with &quot;consult-user&quot; tag)</li>
              <li>Stats: total leads, this week, today</li>
              <li>Search by name or email</li>
              <li>Pagination (50 per page)</li>
              <li>Matched clinics shown per lead with status badges</li>
              <li>Status dropdown: matched → contacted → booked → converted</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-500" />
            Required Environment Variables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-white">Variable</th>
                  <th className="text-left py-2 font-semibold text-gray-900 dark:text-white">Used For</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  { name: "OPENROUTER_API_KEY", use: "AI chat + PDF generation" },
                  { name: "OPENROUTER_MODEL", use: "Model selection (default: openai/gpt-4o-mini)" },
                  { name: "STRIPE_SECRET_KEY", use: "Checkout session creation" },
                  { name: "MAILGUN_API_KEY", use: "All transactional emails" },
                  { name: "MAILGUN_DOMAIN", use: "Email sending domain" },
                  { name: "CRON_SECRET", use: "Vercel cron auth for drip emails" },
                  { name: "NEXT_PUBLIC_APP_URL", use: "Email links + success redirect" },
                ].map((env) => (
                  <tr key={env.name} className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{env.name}</code>
                    </td>
                    <td className="py-2">{env.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Setup Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Setup Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { task: "Run pnpm db:push to create consult_lead_matches table", critical: true },
              { task: "Ensure STRIPE_SECRET_KEY is set in .env.local", critical: true },
              { task: "Ensure OPENROUTER_API_KEY is set in .env.local", critical: true },
              { task: "Ensure MAILGUN_API_KEY + MAILGUN_DOMAIN are set", critical: true },
              { task: "Set CRON_SECRET for Vercel cron authentication", critical: false },
              { task: "Deploy to Vercel to activate cron job (consult-drip)", critical: false },
              { task: "Test full flow: chat → capture → clinic match → email", critical: false },
              { task: "Test Stripe checkout in test mode", critical: false },
            ].map((item) => (
              <div key={item.task} className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    item.critical ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
                <span className="text-muted-foreground">{item.task}</span>
                {item.critical && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
