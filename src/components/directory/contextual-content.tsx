interface ContextualContentProps {
  title: string;
  body: string;
}

/**
 * Server-rendered editorial content block below results.
 * Content is determined by active filters (specialty, insurance, etc.)
 */
export function ContextualContent({ title, body }: ContextualContentProps) {
  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </section>
  );
}
