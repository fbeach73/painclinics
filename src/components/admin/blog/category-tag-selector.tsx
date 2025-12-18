"use client";

import { useState, useCallback } from "react";
import { Check, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  name: string;
  slug: string;
}

interface CategoryTagSelectorProps {
  label: string;
  items: Item[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onCreate: (name: string) => Promise<Item>;
  placeholder?: string;
}

export function CategoryTagSelector({
  label,
  items,
  selected,
  onChange,
  onCreate,
  placeholder = "Select...",
}: CategoryTagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const selectedItems = items.filter((item) => selected.includes(item.id));

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = useCallback(
    (id: string) => {
      if (selected.includes(id)) {
        onChange(selected.filter((s) => s !== id));
      } else {
        onChange([...selected, id]);
      }
    },
    [selected, onChange]
  );

  const handleRemove = useCallback(
    (id: string) => {
      onChange(selected.filter((s) => s !== id));
    },
    [selected, onChange]
  );

  const handleCreate = useCallback(async () => {
    if (!search.trim()) return;

    // Check if item already exists
    const existing = items.find(
      (item) => item.name.toLowerCase() === search.toLowerCase()
    );
    if (existing) {
      if (!selected.includes(existing.id)) {
        onChange([...selected, existing.id]);
      }
      setSearch("");
      return;
    }

    setIsCreating(true);
    try {
      const newItem = await onCreate(search.trim());
      onChange([...selected, newItem.id]);
      setSearch("");
    } catch (error) {
      console.error("Failed to create item:", error);
    } finally {
      setIsCreating(false);
    }
  }, [search, items, selected, onChange, onCreate]);

  const showCreateOption =
    search.trim() &&
    !items.some((item) => item.name.toLowerCase() === search.toLowerCase());

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      {/* Selected items as badges */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {item.name}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {item.name}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Selector popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-muted-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="p-2 border-b">
            <Input
              placeholder={`Search or create ${label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
              onKeyDown={(e) => {
                if (e.key === "Enter" && showCreateOption) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </div>
          <ScrollArea className="max-h-60">
            <div className="p-2 space-y-1">
              {/* Create new option */}
              {showCreateOption && (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent text-left"
                >
                  <Plus className="h-4 w-4 text-primary" />
                  <span>
                    Create &quot;{search}&quot;
                  </span>
                </button>
              )}

              {/* Existing items */}
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const isSelected = selected.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left",
                        isSelected ? "bg-accent" : "hover:bg-accent"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground"
                        )}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span>{item.name}</span>
                    </button>
                  );
                })
              ) : !showCreateOption ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No {label.toLowerCase()} found
                </p>
              ) : null}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
