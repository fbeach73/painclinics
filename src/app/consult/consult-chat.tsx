"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import "./consult.css";

const BODY_LOCATIONS = [
  "Lower back",
  "Neck / Upper back",
  "Knee",
  "Hip",
  "Shoulder",
  "Head / Migraine",
  "Nerve pain",
  "Other",
];

const INITIAL_GREETING =
  "Hello — I'm here to help you make sense of your pain.\n\nI'm not a doctor, but I have deep knowledge of pain conditions, what causes them, and what actually helps. Think of me as a well-read friend you can be completely honest with.\n\n[Q] Where is your pain located? [/Q]";

type CapturePhase = "chat" | "zip-email" | "name-age" | "results" | "upsell";

interface MatchedClinic {
  id: string;
  title: string;
  permalink: string;
  city: string;
  stateAbbreviation: string | null;
  phone: string | null;
  rating: number | null;
  reviewCount: number | null;
  streetAddress: string | null;
  postalCode: string;
}

// Render inline bold (**text**) as <strong> elements
function renderTextWithBold(text: string, baseKey: number): React.ReactNode {
  const boldRegex = /\*\*(.*?)\*\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let k = 0;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<strong key={`b-${baseKey}-${k++}`}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

interface RenderOptions {
  interactive?: boolean;
  onSingleSelect?: (optionText: string) => void;
  multiSelections?: Set<string>;
  onMultiToggle?: (optionText: string) => void;
  onMultiSubmit?: () => void;
  disabled?: boolean;
}

// Strip orphaned [OPTIONS]/[MULTI-OPTIONS] tags that appear outside [Q] blocks
function stripOrphanedTags(text: string): string {
  return text
    .replace(/\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/g, "")
    .replace(/\[MULTI-OPTIONS\]([\s\S]*?)\[\/MULTI-OPTIONS\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Parse [Q]...[/Q], [OPTIONS]...[/OPTIONS], and [MULTI-OPTIONS]...[/MULTI-OPTIONS] tags
function renderMessageContent(text: string, opts?: RenderOptions): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  while (remaining.length > 0) {
    const qStart = remaining.indexOf("[Q]");
    if (qStart === -1) {
      const cleaned = stripOrphanedTags(remaining);
      if (cleaned) {
        parts.push(
          <span key={keyCounter++} style={{ whiteSpace: "pre-wrap" }}>
            {renderTextWithBold(cleaned, keyCounter)}
          </span>
        );
      }
      break;
    }

    if (qStart > 0) {
      const cleaned = stripOrphanedTags(remaining.slice(0, qStart));
      if (cleaned) {
        parts.push(
          <span key={keyCounter++} style={{ whiteSpace: "pre-wrap" }}>
            {renderTextWithBold(cleaned, keyCounter)}
          </span>
        );
      }
    }

    const qEnd = remaining.indexOf("[/Q]", qStart);
    if (qEnd === -1) {
      parts.push(
        <span key={keyCounter++} style={{ whiteSpace: "pre-wrap" }}>
          {renderTextWithBold(remaining.slice(qStart), keyCounter)}
        </span>
      );
      break;
    }

    const questionText = remaining.slice(qStart + 3, qEnd).trim();
    let afterQ = remaining.slice(qEnd + 4);

    // Check for [OPTIONS] (single-select)
    const singleMatch = afterQ.match(/^\s*\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/);
    // Check for [MULTI-OPTIONS] (multi-select)
    const multiMatch = afterQ.match(/^\s*\[MULTI-OPTIONS\]([\s\S]*?)\[\/MULTI-OPTIONS\]/);

    let optionsNode: React.ReactNode = null;
    const thisKey = keyCounter;

    if (singleMatch?.[1]) {
      const options = singleMatch[1].trim().split("·").map((o) => o.trim()).filter(Boolean);
      if (opts?.interactive && opts.onSingleSelect) {
        optionsNode = (
          <div className="q-options" key={`opts-${thisKey}`}>
            {options.map((opt, i) => (
              <button
                key={i}
                className="q-option-btn"
                disabled={opts.disabled}
                onClick={() => opts.onSingleSelect!(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      } else {
        optionsNode = (
          <div className="q-options" key={`opts-${thisKey}`}>
            {options.map((opt, i) => (
              <div key={i} className="q-option-static">
                <strong>{i + 1}.</strong> {opt}
              </div>
            ))}
          </div>
        );
      }
      afterQ = afterQ.slice(singleMatch[0].length);
    } else if (multiMatch?.[1]) {
      const options = multiMatch[1].trim().split("·").map((o) => o.trim()).filter(Boolean);
      if (opts?.interactive && opts.onMultiToggle && opts.onMultiSubmit) {
        const selected = opts.multiSelections ?? new Set<string>();
        optionsNode = (
          <div key={`opts-${thisKey}`}>
            <div className="q-options">
              {options.map((opt, i) => (
                <button
                  key={i}
                  className={`q-option-btn${selected.has(opt) ? " q-option-btn--selected" : ""}`}
                  disabled={opts.disabled}
                  onClick={() => opts.onMultiToggle!(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button
              className="q-multi-submit"
              disabled={opts.disabled || selected.size === 0}
              onClick={opts.onMultiSubmit}
            >
              Next →
            </button>
          </div>
        );
      } else {
        optionsNode = (
          <div className="q-options" key={`opts-${thisKey}`}>
            {options.map((opt, i) => (
              <div key={i} className="q-option-static">
                <strong>{i + 1}.</strong> {opt}
              </div>
            ))}
          </div>
        );
      }
      afterQ = afterQ.slice(multiMatch[0].length);
    }

    parts.push(
      <div className="question-block" key={`q-${keyCounter++}`}>
        <div className="q-label">Next step</div>
        <div className="q-text">{questionText}</div>
        {optionsNode}
      </div>
    );

    remaining = afterQ;
  }

  return <>{parts}</>;
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <span className="clinic-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <span key={i} className="star star-full">★</span>;
        if (i === full && hasHalf) return <span key={i} className="star star-half">★</span>;
        return <span key={i} className="star star-empty">★</span>;
      })}
      <span className="star-num">{rating.toFixed(1)}</span>
    </span>
  );
}

export function ConsultChat() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<HTMLDivElement>(null);
  const lastAiRef = useRef<HTMLDivElement>(null);
  const [chipsUsed, setChipsUsed] = useState(false);
  const [capturePhase, setCapturePhase] = useState<CapturePhase>("chat");
  const [multiSelections, setMultiSelections] = useState<Set<string>>(new Set());

  // Capture form state — step 1: zip + email
  const [zipInput, setZipInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [zipEmailError, setZipEmailError] = useState("");
  const [savedZip, setSavedZip] = useState("");
  const [savedEmail, setSavedEmail] = useState("");

  // Step 2: name + age
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [ageInput, setAgeInput] = useState("");
  const [nameAgeError, setNameAgeError] = useState("");
  const [nameAgeLoading, setNameAgeLoading] = useState(false);

  const [clinicResults, setClinicResults] = useState<MatchedClinic[]>([]);
  const [clinicsLoading, setClinicsLoading] = useState(false);

  const [upsellClicked, setUpsellClicked] = useState(false);

  const initialMessages: UIMessage[] = [
    {
      id: "initial-greeting",
      role: "assistant",
      parts: [{ type: "text", text: INITIAL_GREETING }],
    },
  ];

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/consult/chat" }),
    messages: initialMessages,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Scroll to typing dots when streaming, latest AI message when done,
  // or bottom when capture cards appear
  useEffect(() => {
    if (isStreaming && typingRef.current) {
      typingRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    } else if (capturePhase !== "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (lastAiRef.current) {
      lastAiRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages, isStreaming, capturePhase]);

  // Detect when AI asks for zip code (signals end of triage)
  const captureTriggerRef = useRef(false);
  useEffect(() => {
    if (capturePhase !== "chat") return;
    if (messages.length < 8) return;
    if (isStreaming) return;
    if (captureTriggerRef.current) return;

    const idx = messages.findLastIndex((m) => m.role === "assistant");
    if (idx < 0) return;
    const msg = messages[idx];
    if (!msg) return;
    const part = msg.parts?.find((p) => p.type === "text");
    const text = part && "text" in part ? (part as { type: "text"; text: string }).text : "";

    if (/zip\s*code/i.test(text) && /specialist|clinic|directory/i.test(text)) {
      captureTriggerRef.current = true;
      requestAnimationFrame(() => setCapturePhase("zip-email"));
    }
  }, [messages, isStreaming, capturePhase]);

  function autoResizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function handleSend() {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || isStreaming) return;
    sendMessage({ text });
    el.value = "";
    el.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChipClick(location: string) {
    setChipsUsed(true);
    sendMessage({ text: `My pain is in my ${location.toLowerCase()}.` });
  }

  function handleOptionClick(optionText: string) {
    if (isStreaming) return;
    sendMessage({ text: optionText });
    setMultiSelections(new Set());
  }

  function handleMultiToggle(optionText: string) {
    if (isStreaming) return;
    setMultiSelections((prev) => {
      const next = new Set(prev);
      if (next.has(optionText)) {
        next.delete(optionText);
      } else {
        next.add(optionText);
      }
      return next;
    });
  }

  function handleMultiSubmit() {
    if (isStreaming || multiSelections.size === 0) return;
    const selected = Array.from(multiSelections);
    sendMessage({ text: selected.join(", ") });
    setMultiSelections(new Set());
  }

  function handleChangeAnswer() {
    if (isStreaming) return;
    sendMessage({ text: "I'd like to change my previous answer." });
  }

  function handleZipEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const zip = zipInput.trim();
    const email = emailInput.trim();
    if (!/^\d{5}$/.test(zip)) {
      setZipEmailError("Please enter a valid 5-digit zip code.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setZipEmailError("Please enter a valid email address.");
      return;
    }
    setZipEmailError("");
    setSavedZip(zip);
    setSavedEmail(email);
    setCapturePhase("name-age");
  }

  async function handleNameAgeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const firstName = firstNameInput.trim();
    const lastName = lastNameInput.trim();
    const age = ageInput.trim();

    if (!firstName || !lastName) {
      setNameAgeError("Please enter your first and last name.");
      return;
    }

    setNameAgeError("");
    setNameAgeLoading(true);

    // Derive condition from first user message
    const firstUserMsg = messages.find((m) => m.role === "user");
    const conditionPart = firstUserMsg?.parts?.find((p) => p.type === "text");
    const condition = conditionPart && "text" in conditionPart ? (conditionPart as { type: "text"; text: string }).text : "";

    try {
      await fetch("/api/consult/save-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: savedEmail,
          firstName,
          lastName,
          zipCode: savedZip,
          condition,
          age: age || undefined,
        }),
      });
    } catch {
      // Non-blocking — proceed even if save fails
    }

    setNameAgeLoading(false);
    setCapturePhase("results");
    fetchClinics(savedZip, firstName, condition, age);
  }

  async function fetchClinics(zip: string, firstName: string, condition: string, age: string) {
    setClinicsLoading(true);
    let fetchedClinics: MatchedClinic[] = [];
    try {
      const res = await fetch("/api/consult/match-clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipCode: zip }),
      });
      const data = await res.json() as { clinics?: MatchedClinic[] };
      fetchedClinics = data.clinics ?? [];
      setClinicResults(fetchedClinics);
    } catch {
      setClinicResults([]);
    }
    setClinicsLoading(false);

    // Find the last substantial AI message as the assessment summary
    const lastAssessment = [...messages]
      .reverse()
      .find((m) => {
        if (m.role !== "assistant") return false;
        const part = m.parts?.find((p) => p.type === "text");
        const text = part && "text" in part ? (part as { type: "text"; text: string }).text : "";
        return text.length > 200;
      });
    const assessmentPart = lastAssessment?.parts?.find((p) => p.type === "text");
    const assessmentSummary = assessmentPart && "text" in assessmentPart
      ? (assessmentPart as { type: "text"; text: string }).text
      : "";

    if (assessmentSummary) {
      fetch("/api/consult/send-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: savedEmail,
          firstName,
          condition,
          zipCode: zip,
          age: age || undefined,
          assessmentSummary,
          clinics: fetchedClinics.slice(0, 5).map((c) => ({
            id: c.id,
            title: c.title,
            permalink: c.permalink,
            city: c.city,
            stateAbbreviation: c.stateAbbreviation,
            rating: c.rating,
            reviewCount: c.reviewCount,
          })),
        }),
      }).catch(() => {});
    }

    setTimeout(() => setCapturePhase("upsell"), 3000);
  }

  async function handleUpsellClick() {
    setUpsellClicked(true);

    const lastAssessment = [...messages].reverse().find((m) => {
      if (m.role !== "assistant") return false;
      const part = m.parts?.find((p) => p.type === "text");
      const text = part && "text" in part ? (part as { type: "text"; text: string }).text : "";
      return text.length > 200;
    });
    const assessmentPart = lastAssessment?.parts?.find((p) => p.type === "text");
    const assessmentSummary =
      assessmentPart && "text" in assessmentPart
        ? (assessmentPart as { type: "text"; text: string }).text
        : "";

    const firstUserMsg = messages.find((m) => m.role === "user");
    const conditionPart = firstUserMsg?.parts?.find((p) => p.type === "text");
    const condition =
      conditionPart && "text" in conditionPart
        ? (conditionPart as { type: "text"; text: string }).text
        : "";

    try {
      const res = await fetch("/api/consult/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: savedEmail,
          firstName: firstNameInput.trim(),
          condition,
          zipCode: savedZip,
          age: ageInput.trim() || undefined,
          assessmentSummary,
        }),
      });
      const data = await res.json() as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setUpsellClicked(false);
      }
    } catch {
      setUpsellClicked(false);
    }
  }

  const hasUserMessage = messages.some((m) => m.role === "user");
  const showChips = !hasUserMessage && !chipsUsed && !isStreaming;
  const lastAiIdx = messages.findLastIndex((m) => m.role === "assistant");
  const lastUserIdx = messages.findLastIndex((m) => m.role === "user");

  // Hide text input when the latest AI message has clickable options
  const lastAiMsg = lastAiIdx >= 0 ? messages[lastAiIdx] : null;
  const lastAiText = (() => {
    if (!lastAiMsg) return "";
    const p = lastAiMsg.parts?.find((pt) => pt.type === "text");
    return p && "text" in p ? (p as { type: "text"; text: string }).text : "";
  })();
  const hasInteractiveOptions =
    !isStreaming &&
    lastAiIdx > lastUserIdx &&
    (/\[OPTIONS\]/.test(lastAiText) || /\[MULTI-OPTIONS\]/.test(lastAiText));
  const hideInput = hasInteractiveOptions || showChips;

  return (
    <div className="consult-body">
      <header className="consult-header">
        <div className="consult-logo">
          Pain<span>Clinics</span>.com
        </div>
        <div className="consult-logo-badge">AI Consult</div>
        <div className="consult-header-disclaimer">
          Not a doctor. Think of me as a very well-read friend. For emergencies, call 911.
        </div>
      </header>

      <main className="consult-main">
        <div className="intro-card">
          <div className="intro-title">
            Tell me where it hurts.<br />
            <em>I&apos;ll help you understand what&apos;s going on.</em>
          </div>
          <div className="intro-sub">
            Describe your pain, how long it&apos;s been happening, and what you&apos;ve already
            tried. I&apos;ll give you real information and help you find the right specialist if you
            need one.
          </div>
          <div className="disclaimer-pill">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Information only · Not medical advice · Sources: NIH, Mayo Clinic, PubMed
          </div>
        </div>

        <div className="chat-container">
          {messages.map((message, idx) => {
            const textPart = message.parts?.find((p) => p.type === "text");
            const content = textPart && "text" in textPart ? (textPart as { type: "text"; text: string }).text : "";
            const isUser = message.role === "user";
            const roleClass = isUser ? "user" : "ai";
            const isLatestAi = !isUser && idx === lastAiIdx;
            const isLatestUser = isUser && idx === lastUserIdx;

            return (
              <div key={message.id} ref={isLatestAi ? lastAiRef : undefined}>
                <div className={`message ${roleClass}`}>
                  <div className={`avatar ${roleClass}`}>{isUser ? "You" : "AI"}</div>
                  <div className="bubble">
                    {renderMessageContent(content, isLatestAi ? {
                      interactive: true,
                      onSingleSelect: handleOptionClick,
                      multiSelections,
                      onMultiToggle: handleMultiToggle,
                      onMultiSubmit: handleMultiSubmit,
                      disabled: isStreaming,
                    } : undefined)}
                  </div>
                </div>
                {isLatestUser && !isStreaming && (
                  <div className="change-answer">
                    <button onClick={handleChangeAnswer}>↩ Change answer</button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Body location chips */}
          {showChips && (
            <div className="chips-container">
              {BODY_LOCATIONS.map((loc) => (
                <button key={loc} className="chip" onClick={() => handleChipClick(loc)}>
                  {loc}
                </button>
              ))}
            </div>
          )}

          {/* Typing indicator */}
          {isStreaming && (
            <div className="typing" ref={typingRef}>
              <div className="avatar ai">AI</div>
              <div className="dots">
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
            </div>
          )}

          {/* ── STEP 1: ZIP + EMAIL ── */}
          {capturePhase !== "chat" && (
            <div className="capture-card capture-card--zip">
              <div className="capture-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="capture-heading">Let&apos;s find the right specialist</div>
              <div className="capture-sub">We&apos;ll search our directory of 6,700+ clinics near you and email you a summary of today&apos;s consultation.</div>
              {capturePhase === "zip-email" ? (
                <form onSubmit={handleZipEmailSubmit} className="capture-form" noValidate>
                  <div className="capture-field">
                    <label htmlFor="consult-zip" className="capture-label">Zip code</label>
                    <input
                      id="consult-zip"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      className="capture-input"
                      placeholder="e.g. 90210"
                      value={zipInput}
                      onChange={(e) => setZipInput(e.target.value.replace(/\D/g, ""))}
                      autoFocus
                      autoComplete="postal-code"
                    />
                  </div>
                  <div className="capture-field">
                    <label htmlFor="consult-email" className="capture-label">Email address</label>
                    <input
                      id="consult-email"
                      type="email"
                      className="capture-input"
                      placeholder="you@email.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  {zipEmailError && <div className="capture-error" role="alert">{zipEmailError}</div>}
                  <button type="submit" className="capture-btn">
                    Next →
                  </button>
                  <div className="capture-privacy">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Your information is stored securely with encryption. We never share your data.
                  </div>
                </form>
              ) : (
                <div className="capture-done">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {savedZip} · {savedEmail}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: NAME + AGE ── */}
          {(capturePhase === "name-age" || capturePhase === "results" || capturePhase === "upsell") && (
            <div className="capture-card capture-card--contact">
              <div className="capture-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="capture-heading">Personalize your results</div>
              <div className="capture-sub">The more we know, the better we can tailor your triage report and clinic recommendations. Your data is fully encrypted and never shared.</div>
              {capturePhase === "name-age" ? (
                <form onSubmit={handleNameAgeSubmit} className="capture-form" noValidate>
                  <div className="capture-row">
                    <div className="capture-field">
                      <label htmlFor="consult-fname" className="capture-label">First name</label>
                      <input
                        id="consult-fname"
                        type="text"
                        className="capture-input"
                        placeholder="Jane"
                        value={firstNameInput}
                        onChange={(e) => setFirstNameInput(e.target.value)}
                        autoFocus
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="capture-field">
                      <label htmlFor="consult-lname" className="capture-label">Last name</label>
                      <input
                        id="consult-lname"
                        type="text"
                        className="capture-input"
                        placeholder="Smith"
                        value={lastNameInput}
                        onChange={(e) => setLastNameInput(e.target.value)}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                  <div className="capture-field">
                    <label htmlFor="consult-age" className="capture-label">Age (optional — helps tailor recommendations)</label>
                    <input
                      id="consult-age"
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      className="capture-input"
                      placeholder="e.g. 42"
                      value={ageInput}
                      onChange={(e) => setAgeInput(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  {nameAgeError && <div className="capture-error" role="alert">{nameAgeError}</div>}
                  <button type="submit" className="capture-btn" disabled={nameAgeLoading}>
                    {nameAgeLoading ? "Saving…" : "Find My Clinics"}
                  </button>
                </form>
              ) : (
                <div className="capture-done">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Saved — we&apos;ll be in touch at <strong>{savedEmail}</strong>
                </div>
              )}
            </div>
          )}

          {/* ── CLINIC RESULTS ── */}
          {(capturePhase === "results" || capturePhase === "upsell") && (
            <div className="capture-card capture-card--results">
              <div className="capture-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="capture-heading">Clinics Near You</div>
              {clinicsLoading ? (
                <div className="capture-loading" aria-live="polite">
                  <div className="capture-spinner" aria-hidden="true" />
                  Searching directory…
                </div>
              ) : clinicResults.length === 0 ? (
                <div className="capture-empty">
                  No clinics found in your area.{" "}
                  <Link href="/pain-management" className="capture-link">Browse all clinics →</Link>
                </div>
              ) : (
                <ul className="clinic-result-list" role="list">
                  {clinicResults.map((clinic) => (
                    <li key={clinic.id} className="clinic-result-card">
                      <div className="clinic-result-name">
                        <Link href={`/pain-management/${clinic.permalink}`} className="clinic-result-link">
                          {clinic.title}
                        </Link>
                      </div>
                      <div className="clinic-result-addr">
                        {[clinic.streetAddress, clinic.city, clinic.stateAbbreviation, clinic.postalCode]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      <div className="clinic-result-meta">
                        {clinic.rating != null && clinic.rating > 0 && (
                          <>
                            <StarRating rating={clinic.rating} />
                            {clinic.reviewCount ? <span className="clinic-result-reviews">({clinic.reviewCount})</span> : null}
                          </>
                        )}
                        {clinic.phone && (
                          <a href={`tel:${clinic.phone}`} className="clinic-result-phone">{clinic.phone}</a>
                        )}
                      </div>
                      <Link href={`/pain-management/${clinic.permalink}`} className="clinic-result-cta">
                        View Clinic →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── UPSELL ── */}
          {capturePhase === "upsell" && (
            <div className="capture-card capture-card--upsell">
              <div className="upsell-gradient-bar" aria-hidden="true" />
              <div className="capture-heading upsell-title">Your Personalized Pain Management Plan</div>
              <div className="capture-sub">
                Based on everything you&apos;ve shared today, we can generate a comprehensive document covering:
              </div>
              <ul className="upsell-bullets" role="list">
                <li>Detailed analysis of your specific condition</li>
                <li>Evidence-based treatment protocols tailored to you</li>
                <li>Questions to ask your pain specialist</li>
                <li>Self-care routines and timeline for improvement</li>
                <li>Red flags to watch for</li>
              </ul>
              <div className="upsell-price-row">
                <span className="upsell-price">$19.99</span>
                <span className="upsell-price-note">Could save you hundreds in unnecessary appointments</span>
              </div>
              <button
                className="capture-btn upsell-cta-btn"
                disabled={upsellClicked}
                onClick={handleUpsellClick}
              >
                {upsellClicked ? "Redirecting to checkout…" : "Get Your Personalized Plan"}
              </button>
              <div className="upsell-delivery">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.24 6.24l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Instant PDF delivery to your email
              </div>
            </div>
          )}
        </div>

        <div ref={bottomRef} />
      </main>

      {!hideInput && <div className="input-area">
        <div className="input-inner">
          <textarea
            ref={textareaRef}
            className="consult-textarea"
            rows={1}
            placeholder="Describe your pain or ask a question..."
            onInput={autoResizeTextarea}
            onKeyDown={handleKeyDown}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={isStreaming}
            aria-label="Send message"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="white"
              aria-hidden="true"
            >
              <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" />
            </svg>
          </button>
        </div>
      </div>}
    </div>
  );
}
