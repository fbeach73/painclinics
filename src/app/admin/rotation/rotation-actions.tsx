"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RefreshCw } from "lucide-react";

export function RotateNowButton() {
  const router = useRouter();
  const [batchSize, setBatchSize] = useState(150);
  const [isRotating, setIsRotating] = useState(false);
  const [result, setResult] = useState<{
    unfeaturedCount: number;
    featuredCount: number;
  } | null>(null);

  async function handleRotate() {
    setIsRotating(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/rotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Rotation failed");
      }
      const data = await res.json();
      setResult({
        unfeaturedCount: data.unfeaturedCount,
        featuredCount: data.featuredCount,
      });
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Rotation failed");
    } finally {
      setIsRotating(false);
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="batchSize">Batch Size</Label>
        <Input
          id="batchSize"
          type="number"
          min={1}
          max={500}
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
          className="w-24"
        />
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={isRotating}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRotating ? "animate-spin" : ""}`}
            />
            {isRotating ? "Rotating..." : "Rotate Now"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate Featured Clinics?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unfeature the current free batch and feature {batchSize}{" "}
              new clinics for 7 days. Paying subscribers will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRotate}>
              Confirm Rotation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {result && (
        <p className="text-sm text-muted-foreground">
          Unfeatured {result.unfeaturedCount}, featured {result.featuredCount}{" "}
          new clinics.
        </p>
      )}
    </div>
  );
}
