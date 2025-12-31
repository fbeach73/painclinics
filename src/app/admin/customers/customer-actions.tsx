"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CancelSubscriptionButtonProps {
  subscriptionId: string;
  clinicName: string;
}

export function CancelSubscriptionButton({ subscriptionId, clinicName }: CancelSubscriptionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/${subscriptionId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel subscription");
      }

      toast.success("Subscription canceled", {
        description: `Featured subscription for ${clinicName} has been canceled.`,
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Failed to cancel subscription", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <XCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this subscription? This will:
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 my-4">
          <li>Cancel the subscription in Stripe (if applicable)</li>
          <li>Remove featured status from <strong>{clinicName}</strong></li>
          <li>The clinic owner will no longer be billed</li>
        </ul>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Keep Subscription
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Canceling...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Subscription
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ReverseClaimButtonProps {
  clinicId: string;
  clinicName: string;
}

export function ReverseClaimButton({ clinicId, clinicName }: ReverseClaimButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleReverseClaim = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/${clinicId}/reverse-claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reverse claim");
      }

      toast.success("Claim reversed", {
        description: `Ownership of ${clinicName} has been removed.`,
      });
      setOpen(false);
      setReason("");
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Failed to reverse claim", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
          <UserMinus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reverse Clinic Claim</DialogTitle>
          <DialogDescription>
            Are you sure you want to reverse this claim? This will:
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 my-4">
          <li>Remove ownership from <strong>{clinicName}</strong></li>
          <li>Mark the clinic as unverified</li>
          <li>Expire any approved claims for this clinic</li>
          <li>The clinic will be available for new claims</li>
        </ul>
        <div className="my-4">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea
            id="reason"
            placeholder="e.g., Owner requested removal, Fraudulent claim, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1.5"
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Keep Claim
          </Button>
          <Button
            variant="destructive"
            onClick={handleReverseClaim}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reversing...
              </>
            ) : (
              <>
                <UserMinus className="h-4 w-4 mr-2" />
                Reverse Claim
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
