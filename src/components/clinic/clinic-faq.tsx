import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClinicQuestion } from "@/types/clinic";

interface ClinicFAQProps {
  questions: ClinicQuestion[];
  className?: string;
}

export function ClinicFAQ({ questions, className }: ClinicFAQProps) {
  if (!questions?.length) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Frequently Asked Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {questions.map((q, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left">
                {q.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {q.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
