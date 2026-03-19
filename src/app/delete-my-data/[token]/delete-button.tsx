"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  token: string;
}

export function DeleteButton({ token }: DeleteButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleDelete() {
    setState("loading");
    try {
      const res = await fetch("/api/consult/delete-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 text-center">
        <p className="font-medium text-green-800 dark:text-green-200">
          Your personal data has been permanently removed.
        </p>
        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
          Your name, email, zip code, age, and phone number have been deleted. Only an anonymized
          record of your consultation type and date may be retained.
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 text-center">
          <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setState("idle")}
          className="w-full"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={state === "loading"}
      className="w-full"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {state === "loading" ? "Deleting..." : "Permanently Delete My Data"}
    </Button>
  );
}
