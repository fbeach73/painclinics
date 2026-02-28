"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Check, ChevronsUpDown, Users, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { TargetAudience, TargetFilters } from "@/lib/broadcast/broadcast-queries";
import { cn } from "@/lib/utils";

// Email validation helper
const parseManualEmails = (text: string): string[] => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return text
    .split(/[,\n]+/)
    .map((e) => e.trim())
    .filter((e) => emailRegex.test(e));
};

// US States list
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

// Featured tiers
const FEATURED_TIERS = [
  { value: "none", label: "Free Listings" },
  { value: "basic", label: "Basic ($49.50/mo)" },
  { value: "premium", label: "Premium ($99.50/mo)" },
];

interface RecipientSelectorProps {
  audience: TargetAudience;
  filters: TargetFilters;
  onAudienceChange: (audience: TargetAudience) => void;
  onFiltersChange: (filters: TargetFilters) => void;
}

export function RecipientSelector({
  audience,
  filters,
  onAudienceChange,
  onFiltersChange,
}: RecipientSelectorProps) {
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statesOpen, setStatesOpen] = useState(false);
  // Initialize from saved manualEmails if they exist
  const [manualEmailsText, setManualEmailsText] = useState(
    () => filters.manualEmails?.join(", ") || ""
  );

  // Fetch recipient count when audience or filters change
  const fetchCount = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ audience });
      if (filters.states && filters.states.length > 0) {
        params.set("states", filters.states.join(","));
      }
      if (filters.tiers && filters.tiers.length > 0) {
        params.set("tiers", filters.tiers.join(","));
      }
      if (filters.excludeUnsubscribed) {
        params.set("excludeUnsubscribed", "true");
      }
      if (filters.manualEmails && filters.manualEmails.length > 0) {
        params.set("manualEmails", filters.manualEmails.join(","));
      }

      const res = await fetch(`/api/admin/broadcasts/preview-count?${params}`);
      const data = await res.json();
      setRecipientCount(data.count);
    } catch (error) {
      console.error("Failed to fetch recipient count:", error);
      setRecipientCount(null);
    } finally {
      setIsLoading(false);
    }
  }, [audience, filters]);

  // Debounce the fetch
  useEffect(() => {
    const timer = setTimeout(fetchCount, 300);
    return () => clearTimeout(timer);
  }, [fetchCount]);

  // Handle state selection
  const toggleState = useCallback(
    (stateValue: string) => {
      const currentStates = filters.states || [];
      const newStates = currentStates.includes(stateValue)
        ? currentStates.filter((s) => s !== stateValue)
        : [...currentStates, stateValue];

      const newFilters = { ...filters };
      if (newStates.length > 0) {
        newFilters.states = newStates;
      } else {
        delete newFilters.states;
      }
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  // Handle tier selection
  const toggleTier = useCallback(
    (tierValue: string) => {
      const currentTiers = filters.tiers || [];
      const newTiers = currentTiers.includes(tierValue)
        ? currentTiers.filter((t) => t !== tierValue)
        : [...currentTiers, tierValue];

      const newFilters = { ...filters };
      if (newTiers.length > 0) {
        newFilters.tiers = newTiers;
      } else {
        delete newFilters.tiers;
      }
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  // Handle exclude unsubscribed toggle
  const toggleExcludeUnsubscribed = useCallback(
    (checked: boolean) => {
      const newFilters = { ...filters };
      if (checked) {
        newFilters.excludeUnsubscribed = true;
      } else {
        delete newFilters.excludeUnsubscribed;
      }
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  // Handle manual emails change
  const handleManualEmailsChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setManualEmailsText(text);
      const validEmails = parseManualEmails(text);
      const newFilters = { ...filters };
      if (validEmails.length > 0) {
        newFilters.manualEmails = validEmails;
      } else {
        delete newFilters.manualEmails;
      }
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  // Count valid emails from manual input
  const validEmailCount = useMemo(() => {
    return parseManualEmails(manualEmailsText).length;
  }, [manualEmailsText]);

  // Selected states display
  const selectedStatesDisplay = useMemo(() => {
    const states = filters.states || [];
    if (states.length === 0) return "Select states...";
    if (states.length <= 3) return states.join(", ");
    return `${states.slice(0, 3).join(", ")} +${states.length - 3} more`;
  }, [filters.states]);

  return (
    <div className="space-y-6">
      {/* Recipient count display */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Recipients</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-2xl font-bold">
              {recipientCount?.toLocaleString() ?? "—"}
            </span>
          )}
          <span className="text-muted-foreground">clinics with email</span>
        </div>
      </div>

      {/* Audience type selection */}
      <div className="space-y-3">
        <Label>Target Audience</Label>
        <RadioGroup
          value={audience}
          onValueChange={(value) => {
            onAudienceChange(value as TargetAudience);
            // Reset filters when changing audience type
            const newFilters = { ...filters };
            if (value !== "by_state" && value !== "custom") {
              delete newFilters.states;
            }
            if (value !== "by_tier" && value !== "custom") {
              delete newFilters.tiers;
            }
            if (value !== "manual") {
              delete newFilters.manualEmails;
              setManualEmailsText("");
            }
            onFiltersChange(newFilters);
          }}
          className="grid gap-3"
        >
          <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="all_with_email" id="all_with_email" />
            <Label htmlFor="all_with_email" className="flex-1 cursor-pointer">
              <div className="font-medium">All clinics with email</div>
              <div className="text-sm text-muted-foreground">
                Send to every clinic that has an email address
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="featured_only" id="featured_only" />
            <Label htmlFor="featured_only" className="flex-1 cursor-pointer">
              <div className="font-medium">Featured clinics (non-subscribers)</div>
              <div className="text-sm text-muted-foreground">
                Featured clinics excluding active paying subscribers
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="claimed_owners" id="claimed_owners" />
            <Label htmlFor="claimed_owners" className="flex-1 cursor-pointer">
              <div className="font-medium">Claimed clinic owners (non-subscribers)</div>
              <div className="text-sm text-muted-foreground">
                Users who claimed a listing but haven&apos;t subscribed yet
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="by_state" id="by_state" />
            <Label htmlFor="by_state" className="flex-1 cursor-pointer">
              <div className="font-medium">By state</div>
              <div className="text-sm text-muted-foreground">
                Select specific states to target
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="by_tier" id="by_tier" />
            <Label htmlFor="by_tier" className="flex-1 cursor-pointer">
              <div className="font-medium">By subscription tier</div>
              <div className="text-sm text-muted-foreground">
                Target clinics by their listing tier
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom" className="flex-1 cursor-pointer">
              <div className="font-medium">Custom filter</div>
              <div className="text-sm text-muted-foreground">
                Combine state and tier filters
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual" className="flex-1 cursor-pointer">
              <div className="font-medium">Manual email list</div>
              <div className="text-sm text-muted-foreground">
                Enter specific email addresses
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* State selector (show when by_state or custom) */}
      {(audience === "by_state" || audience === "custom") && (
        <div className="space-y-3">
          <Label>Select States</Label>
          <Popover open={statesOpen} onOpenChange={setStatesOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={statesOpen}
                className="w-full justify-between"
              >
                {selectedStatesDisplay}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search states..." />
                <CommandList>
                  <CommandEmpty>No state found.</CommandEmpty>
                  <CommandGroup>
                    {US_STATES.map((state) => (
                      <CommandItem
                        key={state.value}
                        value={state.label}
                        onSelect={() => toggleState(state.value)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.states?.includes(state.value)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {state.value} - {state.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Selected states badges */}
          {(filters.states?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.states?.map((state) => (
                <Badge
                  key={state}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleState(state)}
                >
                  {state}
                  <span className="ml-1">&times;</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tier selector (show when by_tier or custom) */}
      {(audience === "by_tier" || audience === "custom") && (
        <div className="space-y-3">
          <Label>Select Tiers</Label>
          <div className="space-y-2">
            {FEATURED_TIERS.map((tier) => (
              <div key={tier.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`tier-${tier.value}`}
                  checked={filters.tiers?.includes(tier.value) ?? false}
                  onCheckedChange={() => toggleTier(tier.value)}
                />
                <Label
                  htmlFor={`tier-${tier.value}`}
                  className="cursor-pointer"
                >
                  {tier.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual email input (show when manual) */}
      {audience === "manual" && (
        <div className="space-y-3">
          <Label>Enter Email Addresses</Label>
          <Textarea
            placeholder={"email1@example.com, email2@example.com\nemail3@example.com"}
            value={manualEmailsText}
            onChange={handleManualEmailsChange}
            rows={5}
          />
          <p className="text-sm text-muted-foreground">
            Enter email addresses separated by commas or new lines.
            {validEmailCount > 0 && ` ${validEmailCount} valid email(s) detected.`}
          </p>
        </div>
      )}

      {/* Exclude unsubscribed option */}
      <div className="flex items-center space-x-2 pt-2 border-t">
        <Checkbox
          id="exclude-unsubscribed"
          checked={filters.excludeUnsubscribed ?? true}
          onCheckedChange={(checked) => toggleExcludeUnsubscribed(checked as boolean)}
        />
        <Label htmlFor="exclude-unsubscribed" className="cursor-pointer text-sm">
          Exclude users who have unsubscribed from emails
        </Label>
      </div>
    </div>
  );
}
