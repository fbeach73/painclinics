"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import "./chat-widget.css";

function getFingerprint(): string {
  const c = [navigator.userAgent, navigator.language, screen.width, screen.height, new Date().getTimezoneOffset()];
  return btoa(c.join("|")).slice(0, 32);
}
function trackConsultEvent(eventType: "consult_start" | "consult_message", path: string) {
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, path, fingerprint: getFingerprint(), referrer: document.referrer || "" }),
    keepalive: true,
  }).catch(() => {});
}

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

    const singleMatch = afterQ.match(/^\s*\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/);
    const multiMatch = afterQ.match(/^\s*\[MULTI-OPTIONS\]([\s\S]*?)\[\/MULTI-OPTIONS\]/);

    let optionsNode: React.ReactNode = null;
    const thisKey = keyCounter;

    if (singleMatch?.[1]) {
      const options = singleMatch[1].trim().split("·").map((o) => o.trim()).filter(Boolean);
      if (opts?.interactive && opts.onSingleSelect) {
        optionsNode = (
          <div className="cw-q-options" key={`opts-${thisKey}`}>
            {options.map((opt, i) => (
              <button
                key={i}
                className="cw-q-option-btn"
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
          <div className="cw-q-options" key={`opts-${thisKey}`}>
            {options.map((opt, i) => (
              <div key={i} className="cw-q-option-static">
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
            <div className="cw-q-options">
              {options.map((opt, i) => (
                <button
                  key={i}
                  className={`cw-q-option-btn${selected.has(opt) ? " cw-q-option-btn--selected" : ""}`}
                  disabled={opts.disabled}
                  onClick={() => opts.onMultiToggle!(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button
              className="cw-q-multi-submit"
              disabled={opts.disabled || selected.size === 0}
              onClick={opts.onMultiSubmit}
            >
              Next →
            </button>
          </div>
        );
      } else {
        optionsNode = (
          <div className="cw-q-options" key={`opts-${thisKey}`}>
            {options.map((opt, i) => (
              <div key={i} className="cw-q-option-static">
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
    <span className="cw-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <span key={i} className="cw-star cw-star-full">★</span>;
        if (i === full && hasHalf) return <span key={i} className="cw-star cw-star-half">★</span>;
        return <span key={i} className="cw-star cw-star-empty">★</span>;
      })}
      <span className="cw-star-num">{rating.toFixed(1)}</span>
    </span>
  );
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [pulseDone, setPulseDone] = useState(false);
  const [chipsUsed, setChipsUsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastAiRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<HTMLDivElement>(null);

  const [capturePhase, setCapturePhase] = useState<CapturePhase>("chat");
  const [multiSelections, setMultiSelections] = useState<Set<string>>(new Set());
  const [zipInput, setZipInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [zipEmailError, setZipEmailError] = useState("");
  const [savedZip, setSavedZip] = useState("");
  const [savedEmail, setSavedEmail] = useState("");

  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [ageInput, setAgeInput] = useState("");
  const [nameAgeError, setNameAgeError] = useState("");
  const [nameAgeLoading, setNameAgeLoading] = useState(false);

  const [clinicResults, setClinicResults] = useState<MatchedClinic[]>([]);
  const [clinicsLoading, setClinicsLoading] = useState(false);
  const [upsellClicked, setUpsellClicked] = useState(false);

  // Stop pulse after it plays
  useEffect(() => {
    const timer = setTimeout(() => setPulseDone(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const initialMessages: UIMessage[] = [
    {
      id: "widget-greeting",
      role: "assistant",
      parts: [{ type: "text", text: INITIAL_GREETING }],
    },
  ];

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/consult/chat" }),
    messages: initialMessages,
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const hasUserMessage = messages.some((m) => m.role === "user");
  const showChips = !hasUserMessage && !chipsUsed && !isStreaming;

  // Scroll to typing indicator when streaming, latest AI message for new messages,
  // or bottom of panel when capture phase changes (results/upsell cards appear below)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isStreaming && typingRef.current) {
      typingRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    } else if (capturePhase !== "chat") {
      // Capture cards are at the bottom — scroll there
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      lastAiRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages.length, isStreaming, capturePhase]);

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

  function openPanel() {
    setIsClosing(false);
    setIsOpen(true);
    trackConsultEvent("consult_start", "/widget");
    setTimeout(() => textareaRef.current?.focus(), 280);
  }

  function closePanel() {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  }

  function togglePanel() {
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function autoResizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  }

  function handleSend() {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || isStreaming) return;
    trackConsultEvent("consult_message", "/widget");
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
    trackConsultEvent("consult_message", "/widget");
    sendMessage({ text: `My pain is in my ${location.toLowerCase()}.` });
  }

  function handleOptionClick(optionText: string) {
    if (isStreaming) return;
    trackConsultEvent("consult_message", "/widget");
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
    trackConsultEvent("consult_message", "/widget");
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
      setZipEmailError("Enter a valid 5-digit zip.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setZipEmailError("Enter a valid email.");
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
      setNameAgeError("First and last name required.");
      return;
    }

    setNameAgeError("");
    setNameAgeLoading(true);

    const firstUserMsg = messages.find((m) => m.role === "user");
    const conditionPart = firstUserMsg?.parts?.find((p) => p.type === "text");
    const condition = conditionPart && "text" in conditionPart ? (conditionPart as { type: "text"; text: string }).text : "";

    try {
      await fetch("/api/consult/save-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: savedEmail, firstName, lastName, zipCode: savedZip, condition, age: age || undefined }),
      });
    } catch {
      // Non-blocking
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

  const panelState = isClosing ? "closing" : "open";

  return (
    <div className="consult-widget">
      {(isOpen || isClosing) && (
        <div className="cw-panel" data-state={panelState} role="dialog" aria-label="PainConsult AI chat">
          {/* Header */}
          <div className="cw-header">
            <div className="cw-header-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <div className="cw-header-title">PainConsult AI</div>
              <div className="cw-header-subtitle">Pain information assistant</div>
            </div>
            <div className="cw-header-disclaimer" aria-label="Disclaimer">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Not medical advice
            </div>
            <button className="cw-close-btn" onClick={closePanel} aria-label="Close chat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="cw-messages" role="log" aria-live="polite" aria-label="Conversation">
            {(() => {
              const lastAiIdx = messages.findLastIndex((m) => m.role === "assistant");
              const lastUserIdx = messages.findLastIndex((m) => m.role === "user");
              return messages.map((message, idx) => {
                const textPart = message.parts?.find((p) => p.type === "text");
                const content =
                  textPart && "text" in textPart
                    ? (textPart as { type: "text"; text: string }).text
                    : "";
                const isUser = message.role === "user";
                const roleClass = isUser ? "cw-user" : "cw-ai";
                const isLatestAi = !isUser && idx === lastAiIdx;
                const isLatestUser = isUser && idx === lastUserIdx;

                return (
                  <div key={message.id}>
                    <div className={`cw-message ${roleClass}`} ref={isLatestAi ? lastAiRef : undefined}>
                      <div className={`cw-avatar ${isUser ? "cw-user" : "cw-ai"}`} aria-hidden="true">
                        {isUser ? "You" : "AI"}
                      </div>
                      <div className="cw-bubble">
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
                      <div className="cw-change-answer">
                        <button onClick={handleChangeAnswer}>↩ Change answer</button>
                      </div>
                    )}
                  </div>
                );
              });
            })()}

            {showChips && (
              <div className="cw-chips">
                {BODY_LOCATIONS.map((loc) => (
                  <button key={loc} className="cw-chip" onClick={() => handleChipClick(loc)}>
                    {loc}
                  </button>
                ))}
              </div>
            )}

            {isStreaming && (
              <div className="cw-typing" ref={typingRef} aria-label="AI is typing">
                <div className="cw-avatar cw-ai" aria-hidden="true">AI</div>
                <div className="cw-dots" aria-hidden="true">
                  <div className="cw-dot" />
                  <div className="cw-dot" />
                  <div className="cw-dot" />
                </div>
              </div>
            )}

            {/* ── STEP 1: ZIP + EMAIL ── */}
            {capturePhase !== "chat" && (
              <div className="cw-capture-card cw-capture--zip">
                <div className="cw-capture-heading">Find the right specialist</div>
                {capturePhase === "zip-email" ? (
                  <form onSubmit={handleZipEmailSubmit} className="cw-capture-form" noValidate>
                    <label htmlFor="cw-zip" className="cw-capture-label">Zip code</label>
                    <input
                      id="cw-zip"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      className="cw-capture-input"
                      placeholder="e.g. 90210"
                      value={zipInput}
                      onChange={(e) => setZipInput(e.target.value.replace(/\D/g, ""))}
                      autoFocus
                      autoComplete="postal-code"
                    />
                    <label htmlFor="cw-email" className="cw-capture-label">Email</label>
                    <input
                      id="cw-email"
                      type="email"
                      className="cw-capture-input"
                      placeholder="you@email.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      autoComplete="email"
                    />
                    {zipEmailError && <div className="cw-capture-error" role="alert">{zipEmailError}</div>}
                    <button type="submit" className="cw-capture-btn">Next →</button>
                    <div className="cw-capture-privacy">Encrypted &amp; never shared.</div>
                  </form>
                ) : (
                  <div className="cw-capture-done">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {savedZip} · {savedEmail}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: NAME + AGE ── */}
            {(capturePhase === "name-age" || capturePhase === "results" || capturePhase === "upsell") && (
              <div className="cw-capture-card cw-capture--contact">
                <div className="cw-capture-heading">Personalize your results</div>
                <div className="cw-capture-sub">Better data = better recommendations.</div>
                {capturePhase === "name-age" ? (
                  <form onSubmit={handleNameAgeSubmit} className="cw-capture-form" noValidate>
                    <div className="cw-capture-row cw-capture-names">
                      <div>
                        <label htmlFor="cw-fname" className="cw-capture-label">First</label>
                        <input id="cw-fname" type="text" className="cw-capture-input" placeholder="Jane" value={firstNameInput} onChange={(e) => setFirstNameInput(e.target.value)} autoFocus autoComplete="given-name" />
                      </div>
                      <div>
                        <label htmlFor="cw-lname" className="cw-capture-label">Last</label>
                        <input id="cw-lname" type="text" className="cw-capture-input" placeholder="Smith" value={lastNameInput} onChange={(e) => setLastNameInput(e.target.value)} autoComplete="family-name" />
                      </div>
                    </div>
                    <label htmlFor="cw-age" className="cw-capture-label">Age (optional)</label>
                    <input id="cw-age" type="text" inputMode="numeric" maxLength={3} className="cw-capture-input" placeholder="e.g. 42" value={ageInput} onChange={(e) => setAgeInput(e.target.value.replace(/\D/g, ""))} />
                    {nameAgeError && <div className="cw-capture-error" role="alert">{nameAgeError}</div>}
                    <button type="submit" className="cw-capture-btn" disabled={nameAgeLoading}>
                      {nameAgeLoading ? "Saving…" : "Find My Clinics"}
                    </button>
                  </form>
                ) : (
                  <div className="cw-capture-done">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved — <strong>{savedEmail}</strong>
                  </div>
                )}
              </div>
            )}

            {/* ── CLINIC RESULTS ── */}
            {(capturePhase === "results" || capturePhase === "upsell") && (
              <div className="cw-capture-card cw-capture--results">
                <div className="cw-capture-heading">Clinics Near You</div>
                {clinicsLoading ? (
                  <div className="cw-capture-loading" aria-live="polite">
                    <div className="cw-capture-spinner" aria-hidden="true" />
                    Searching…
                  </div>
                ) : clinicResults.length === 0 ? (
                  <div className="cw-capture-empty">
                    None found.{" "}
                    <Link href="/pain-management" className="cw-capture-link">Browse all →</Link>
                  </div>
                ) : (
                  <ul className="cw-clinic-list" role="list">
                    {clinicResults.slice(0, 5).map((clinic) => (
                      <li key={clinic.id} className="cw-clinic-card">
                        <Link href={`/pain-management/${clinic.permalink}`} className="cw-clinic-name">
                          {clinic.title}
                        </Link>
                        <div className="cw-clinic-addr">
                          {[clinic.city, clinic.stateAbbreviation].filter(Boolean).join(", ")}
                        </div>
                        {clinic.rating != null && clinic.rating > 0 && (
                          <div className="cw-clinic-meta">
                            <StarRating rating={clinic.rating} />
                            {clinic.reviewCount ? <span className="cw-clinic-reviews">({clinic.reviewCount})</span> : null}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <Link href="/pain-management" className="cw-capture-link cw-view-all">View all clinics →</Link>
              </div>
            )}

            {/* ── UPSELL ── */}
            {capturePhase === "upsell" && (
              <div className="cw-capture-card cw-capture--upsell">
                <div className="cw-upsell-bar" aria-hidden="true" />
                <div className="cw-capture-heading">Personalized Pain Plan</div>
                <div className="cw-upsell-sub">Get a comprehensive document with your condition analysis, treatment protocols, and specialist questions.</div>
                <div className="cw-upsell-price"><span>$19.99</span> · Instant PDF</div>
                <button
                  className="cw-capture-btn"
                  disabled={upsellClicked}
                  onClick={handleUpsellClick}
                >
                  {upsellClicked ? "Redirecting…" : "Get My Plan"}
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="cw-input-area">
            <div className="cw-input-inner">
              <textarea
                ref={textareaRef}
                className="cw-textarea"
                rows={1}
                placeholder="Describe your pain or ask a question..."
                onInput={autoResizeTextarea}
                onKeyDown={handleKeyDown}
                aria-label="Message input"
              />
              <button
                className="cw-send-btn"
                onClick={handleSend}
                disabled={isStreaming}
                aria-label="Send message"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" />
                </svg>
              </button>
            </div>
            <div className="cw-footer">
              <a href="/consult">Open full conversation &rarr;</a>
            </div>
          </div>
        </div>
      )}

      {/* Floating trigger */}
      <button
        className={`cw-trigger${!pulseDone && !isOpen ? " cw-trigger--pulse" : ""}`}
        onClick={togglePanel}
        aria-label={isOpen ? "Close PainConsult AI chat" : "Open PainConsult AI chat"}
        aria-expanded={isOpen}
        aria-controls={isOpen ? "cw-panel" : undefined}
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {!isOpen && <span className="cw-trigger-label">AI</span>}
      </button>
    </div>
  );
}
