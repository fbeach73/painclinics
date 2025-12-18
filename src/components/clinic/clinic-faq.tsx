import { HelpCircle } from "lucide-react";
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
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <HelpCircle className="h-5 w-5 text-primary" />
          Frequently Asked Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="single" collapsible className="w-full space-y-2">
          {questions.map((q, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border rounded-lg px-4 data-[state=open]:bg-muted/50"
            >
              <AccordionTrigger className="text-left py-4 hover:no-underline gap-3">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="font-medium text-base">{q.question}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pl-8 text-muted-foreground leading-relaxed">
                {q.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
