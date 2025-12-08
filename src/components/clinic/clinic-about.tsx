import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ClinicAboutProps {
  about: string;
  className?: string;
}

export function ClinicAbout({ about, className }: ClinicAboutProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('text-muted-foreground leading-relaxed whitespace-pre-line')}>
          {about}
        </p>
      </CardContent>
    </Card>
  );
}
