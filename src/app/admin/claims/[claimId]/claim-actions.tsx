"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface ClaimActionsProps {
  claimId: string;
  clinicName: string;
}

export function ClaimActions({ claimId, clinicName }: ClaimActionsProps) {
  const router = useRouter();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/claims/${claimId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: adminNotes || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve claim");
      }

      toast.success("Claim approved successfully", {
        description: `Ownership of ${clinicName} has been transferred.`,
      });
      setApproveOpen(false);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Failed to approve claim", {
        description: errorMessage,
        duration: 5000, // Show longer for debugging
        action: {
          label: "Retry",
          onClick: () => handleApprove(),
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason required", {
        description: "Please provide a reason for rejecting this claim.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/claims/${claimId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rejectionReason,
          adminNotes: adminNotes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject claim");
      }

      toast.success("Claim rejected", {
        description: "The claimant has been notified via email.",
      });
      setRejectOpen(false);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Failed to reject claim", {
        description: errorMessage,
        duration: 5000, // Show longer for debugging
        action: {
          label: "Retry",
          onClick: () => handleReject(),
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Review Actions</CardTitle>
        <CardDescription>
          Approve or reject this claim request. The claimant will be notified via email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
            <Textarea
              id="admin-notes"
              placeholder="Add any internal notes about this claim..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="flex gap-3 pt-2">
            {/* Approve Dialog */}
            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Claim
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Claim</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to approve this claim? This will:
                  </DialogDescription>
                </DialogHeader>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 my-4">
                  <li>Transfer ownership of <strong>{clinicName}</strong> to the claimant</li>
                  <li>Mark the clinic as verified</li>
                  <li>Grant the claimant the &quot;clinic_owner&quot; role</li>
                  <li>Expire any other pending claims for this clinic</li>
                  <li>Send an approval notification email</li>
                </ul>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setApproveOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleApprove}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Approval
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex-1">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Claim
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Claim</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for rejecting this claim. This will be sent to the claimant.
                  </DialogDescription>
                </DialogHeader>
                <div className="my-4">
                  <Label htmlFor="rejection-reason">
                    Rejection Reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="e.g., Unable to verify ownership. Please provide additional documentation..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-1.5"
                    rows={4}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRejectOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isLoading || !rejectionReason.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Confirm Rejection
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
