"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";

interface EmailGateProps {
  open: boolean;
  onSubmit: (email: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function EmailGate({ open, onSubmit, onOpenChange }: EmailGateProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    onSubmit(trimmed);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-600" />
            Unlock Unlimited Content
          </DialogTitle>
          <DialogDescription>
            Enter your email to continue generating free patient education
            content. No spam, just helpful tools for your clinic.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gate-email">Work Email</Label>
            <Input
              id="gate-email"
              type="email"
              placeholder="you@yourclinic.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500">
            Continue Generating Content
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
