'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Turnstile } from '@/components/ui/turnstile';
import { signIn } from '@/lib/auth-client';

const roleValues = ['owner', 'manager', 'authorized_representative'] as const;

const claimFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(roleValues, {
    message: 'Please select your role',
  }),
  businessEmail: z.string().email('Please enter a valid email address'),
  businessPhone: z.string().min(10, 'Please enter a valid phone number'),
  additionalNotes: z.string().optional(),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

interface ClaimFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  clinicName: string;
  isLoggedIn: boolean;
}

export function ClaimFormModal({
  open,
  onOpenChange,
  clinicId,
  clinicName,
  isLoggedIn,
}: ClaimFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      fullName: '',
      businessEmail: '',
      businessPhone: '',
      additionalNotes: '',
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = form;

  const selectedRole = watch('role');

  const onSubmit = async (data: ClaimFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicId,
          turnstileToken,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit claim');
      }

      toast.success('Claim submitted successfully', {
        description:
          'Your claim is now pending review. We will contact you once it has been reviewed.',
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to submit claim', {
        description:
          error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = () => {
    signIn.social({ provider: 'google' });
  };

  // If not logged in, show sign-in prompt
  if (!isLoggedIn) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Claim {clinicName}
            </DialogTitle>
            <DialogDescription>
              Sign in to claim this listing and manage your clinic profile.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Claiming this listing allows you to:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Update your clinic information</li>
              <li>Respond to patient inquiries</li>
              <li>Add photos and services</li>
              <li>Access analytics and insights</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignIn}>Sign In to Claim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Claim {clinicName}
          </DialogTitle>
          <DialogDescription>
            Please provide your information to verify ownership of this clinic.
            Our team will review your request within 1-2 business days.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="John Smith"
              {...register('fullName')}
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Your Role *</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setValue('role', value as ClaimFormValues['role'])
              }
            >
              <SelectTrigger id="role" aria-invalid={!!errors.role}>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="authorized_representative">
                  Authorized Representative
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessEmail">Business Email *</Label>
            <Input
              id="businessEmail"
              type="email"
              placeholder="john@clinic.com"
              {...register('businessEmail')}
              aria-invalid={!!errors.businessEmail}
            />
            {errors.businessEmail && (
              <p className="text-sm text-destructive">
                {errors.businessEmail.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessPhone">Business Phone *</Label>
            <Input
              id="businessPhone"
              type="tel"
              placeholder="(555) 123-4567"
              {...register('businessPhone')}
              aria-invalid={!!errors.businessPhone}
            />
            {errors.businessPhone && (
              <p className="text-sm text-destructive">
                {errors.businessPhone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Any additional information to help verify your claim..."
              rows={3}
              {...register('additionalNotes')}
            />
          </div>

          <Turnstile onSuccess={setTurnstileToken} className="mt-4" />

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !turnstileToken}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Claim
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
