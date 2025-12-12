import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('text-muted-foreground leading-relaxed whitespace-pre-line')}>
          {content}
        </p>
      </CardContent>
    </Card>
  );
}
