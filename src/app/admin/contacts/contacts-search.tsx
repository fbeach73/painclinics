"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ContactsSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const [value, setValue] = useState(currentSearch);

  const handleSearch = (searchValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue) {
      params.set("search", searchValue);
    } else {
      params.delete("search");
    }
    params.delete("page");
    startTransition(() => {
      router.push(`/admin/contacts?${params.toString()}`);
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch(value);
      }}
      className="relative w-full max-w-sm"
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search by name or email..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9 pr-20"
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              setValue("");
              handleSearch("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className="h-7"
          disabled={isPending}
        >
          {isPending ? "..." : "Search"}
        </Button>
      </div>
    </form>
  );
}
