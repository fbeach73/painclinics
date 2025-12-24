'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Turnstile } from '@/components/ui/turnstile';
import { cn } from '@/lib/utils';

type FormStep =
  | 'pain-type'
  | 'pain-duration'
  | 'previous-treatment'
  | 'insurance'
  | 'contact-info'
  | 'success';

const STEPS: FormStep[] = [
  'pain-type',
  'pain-duration',
  'previous-treatment',
  'insurance',
  'contact-info',
];

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email'),
  preferredContactTime: z.enum(['morning', 'afternoon', 'evening', 'anytime']),
  additionalInfo: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactClinicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  clinicName: string;
  clinicCity: string;
  clinicState: string;
}

interface QuestionOption {
  value: string;
  label: string;
}

const PAIN_TYPE_OPTIONS: QuestionOption[] = [
  { value: 'back_neck', label: 'Back or neck pain (spine-related)' },
  { value: 'joint', label: 'Joint pain (knee, hip, shoulder)' },
  { value: 'nerve', label: 'Nerve pain or neuropathy' },
  {
    value: 'chronic',
    label: 'Chronic pain condition (fibromyalgia, migraines)',
  },
];

const PAIN_DURATION_OPTIONS: QuestionOption[] = [
  { value: 'under_3_months', label: 'Less than 3 months' },
  { value: '3_6_months', label: '3-6 months' },
  { value: '6_12_months', label: '6-12 months' },
  { value: 'over_1_year', label: 'Over 1 year' },
];

const PREVIOUS_TREATMENT_OPTIONS: QuestionOption[] = [
  { value: 'none', label: 'No, this would be my first consultation' },
  { value: 'medications', label: 'Yes, medications only' },
  { value: 'therapy_injections', label: 'Yes, physical therapy or injections' },
  { value: 'surgery', label: 'Yes, previous surgery or advanced procedures' },
];

const INSURANCE_OPTIONS: QuestionOption[] = [
  { value: 'private', label: 'Yes, private insurance' },
  { value: 'medicare_medicaid', label: 'Yes, Medicare/Medicaid' },
  { value: 'workers_comp', label: "Workers' compensation case" },
  { value: 'self_pay', label: 'Self-pay / No insurance' },
];

const STEP_TITLES: Record<FormStep, string> = {
  'pain-type': 'What type of pain are you seeking treatment for?',
  'pain-duration': 'How long have you been experiencing this pain?',
  'previous-treatment': 'Have you tried pain management treatments before?',
  insurance: 'Do you have health insurance?',
  'contact-info': 'Almost done! How can we reach you?',
  success: 'Thank you!',
};

export function ContactClinicModal({
  open,
  onOpenChange,
  clinicId,
  clinicName,
  clinicCity,
  clinicState,
}: ContactClinicModalProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('pain-type');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [painType, setPainType] = useState<string | null>(null);
  const [painDuration, setPainDuration] = useState<string | null>(null);
  const [previousTreatment, setPreviousTreatment] = useState<string | null>(
    null
  );
  const [insurance, setInsurance] = useState<string | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      additionalInfo: '',
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset: resetForm,
    formState: { errors },
  } = form;

  const preferredContactTime = watch('preferredContactTime');

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progressPercent =
    currentStep === 'success'
      ? 100
      : ((currentStepIndex + 1) / STEPS.length) * 100;

  const resetModal = () => {
    setCurrentStep('pain-type');
    setDirection('forward');
    setPainType(null);
    setPainDuration(null);
    setPreviousTreatment(null);
    setInsurance(null);
    setTurnstileToken(null);
    resetForm();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetModal();
    }
    onOpenChange(open);
  };

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    const nextStep = STEPS[nextIndex];
    if (nextStep) {
      setDirection('forward');
      setCurrentStep(nextStep);
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    const prevStep = STEPS[prevIndex];
    if (prevStep) {
      setDirection('backward');
      setCurrentStep(prevStep);
    }
  };

  const handleOptionSelect = (value: string) => {
    switch (currentStep) {
      case 'pain-type':
        setPainType(value);
        break;
      case 'pain-duration':
        setPainDuration(value);
        break;
      case 'previous-treatment':
        setPreviousTreatment(value);
        break;
      case 'insurance':
        setInsurance(value);
        break;
    }
    setTimeout(goToNextStep, 300);
  };

  const getCurrentValue = (): string | null => {
    switch (currentStep) {
      case 'pain-type':
        return painType;
      case 'pain-duration':
        return painDuration;
      case 'previous-treatment':
        return previousTreatment;
      case 'insurance':
        return insurance;
      default:
        return null;
    }
  };

  const getCurrentOptions = (): QuestionOption[] => {
    switch (currentStep) {
      case 'pain-type':
        return PAIN_TYPE_OPTIONS;
      case 'pain-duration':
        return PAIN_DURATION_OPTIONS;
      case 'previous-treatment':
        return PREVIOUS_TREATMENT_OPTIONS;
      case 'insurance':
        return INSURANCE_OPTIONS;
      default:
        return [];
    }
  };

  const getOptionLabel = (
    value: string | null,
    options: QuestionOption[]
  ): string => {
    if (!value) return '';
    const option = options.find((o) => o.value === value);
    return option?.label || value;
  };

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicId,
          painType: getOptionLabel(painType, PAIN_TYPE_OPTIONS),
          painDuration: getOptionLabel(painDuration, PAIN_DURATION_OPTIONS),
          previousTreatment: getOptionLabel(
            previousTreatment,
            PREVIOUS_TREATMENT_OPTIONS
          ),
          insurance: getOptionLabel(insurance, INSURANCE_OPTIONS),
          turnstileToken,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit inquiry');
      }

      setDirection('forward');
      setCurrentStep('success');
    } catch (error) {
      toast.error('Failed to submit inquiry', {
        description:
          error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionStep = () => {
    const options = getCurrentOptions();
    const currentValue = getCurrentValue();

    return (
      <div
        key={currentStep}
        className={cn(
          'animate-in fade-in-0 duration-300',
          direction === 'forward' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'
        )}
      >
        <RadioGroup
          value={currentValue || ''}
          onValueChange={handleOptionSelect}
          className="space-y-3"
        >
          {options.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all',
                'hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/20',
                currentValue === option.value
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                  : 'border-border'
              )}
            >
              <RadioGroupItem value={option.value} />
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>
    );
  };

  const renderContactStep = () => (
    <div
      key="contact-info"
      className={cn(
        'animate-in fade-in-0 duration-300',
        direction === 'forward' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            placeholder="John Smith"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            {...register('phone')}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredContactTime">Best Time to Reach You *</Label>
          <Select
            value={preferredContactTime}
            onValueChange={(value) =>
              setValue(
                'preferredContactTime',
                value as ContactFormValues['preferredContactTime']
              )
            }
          >
            <SelectTrigger
              id="preferredContactTime"
              aria-invalid={!!errors.preferredContactTime}
            >
              <SelectValue placeholder="Select a time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
              <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
              <SelectItem value="evening">Evening (5pm - 8pm)</SelectItem>
              <SelectItem value="anytime">Anytime</SelectItem>
            </SelectContent>
          </Select>
          {errors.preferredContactTime && (
            <p className="text-sm text-destructive">
              {errors.preferredContactTime.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">
            Additional Information (Optional)
          </Label>
          <Textarea
            id="additionalInfo"
            placeholder="Any specific concerns or questions you'd like to discuss..."
            rows={3}
            {...register('additionalInfo')}
          />
        </div>

        <Turnstile onSuccess={setTurnstileToken} className="mt-4" />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={goToPreviousStep}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !turnstileToken}
            className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Submit
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  const renderSuccessStep = () => (
    <div
      key="success"
      className="animate-in fade-in-0 slide-in-from-right-4 duration-300 text-center py-6"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Your inquiry has been sent!</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {clinicName} in {clinicCity}, {clinicState} will contact you soon.
      </p>
      <Button onClick={() => handleOpenChange(false)} className="w-full">
        Close
      </Button>
    </div>
  );

  const renderStepContent = () => {
    if (currentStep === 'success') {
      return renderSuccessStep();
    }

    if (currentStep === 'contact-info') {
      return renderContactStep();
    }

    return renderQuestionStep();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={currentStep !== 'success'}>
        {currentStep !== 'success' && (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-teal-600" />
              Contact {clinicName}
            </DialogTitle>
            <DialogDescription>
              Answer a few quick questions so the clinic can better assist you.
            </DialogDescription>
          </DialogHeader>
        )}

        {/* Progress bar */}
        {currentStep !== 'success' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Step {currentStepIndex + 1} of {STEPS.length}
              </span>
              <span>{Math.round(progressPercent)}% complete</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-blue-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Question title */}
        {currentStep !== 'success' && (
          <h3 className="font-medium text-base">{STEP_TITLES[currentStep]}</h3>
        )}

        {/* Step content */}
        {renderStepContent()}

        {/* Back button for question steps (not contact-info or success) */}
        {currentStep !== 'contact-info' &&
          currentStep !== 'success' &&
          currentStepIndex > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={goToPreviousStep}
              className="w-full mt-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
      </DialogContent>
    </Dialog>
  );
}
