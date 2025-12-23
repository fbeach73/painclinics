import { Card, CardContent } from '@/components/ui/card';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { cn } from '@/lib/utils';

interface ClinicAboutProps {
  about: string;
  enhancedAbout?: string | undefined;
  className?: string;
}

export function ClinicAbout({ about, enhancedAbout, className }: ClinicAboutProps) {
  // Prefer enhanced content if available
  const content = enhancedAbout || about;

  if (!content) return null;

  // Check if content contains HTML tags
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        {isHtml ? (
          <div
            className={cn(
              'prose prose-sm max-w-none',
              'prose-headings:text-foreground prose-headings:font-semibold',
              'prose-h2:text-xl prose-h2:mt-0 prose-h2:mb-3',
              'prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2',
              'prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-2',
              'prose-strong:text-foreground prose-strong:font-semibold',
              'prose-ul:my-2 prose-ul:text-muted-foreground',
              'prose-li:my-1 prose-li:text-muted-foreground',
              'prose-a:text-primary prose-a:no-underline hover:prose-a:underline'
            )}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
          />
        ) : (
          <p className={cn('text-muted-foreground leading-relaxed whitespace-pre-line')}>
            {content}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
