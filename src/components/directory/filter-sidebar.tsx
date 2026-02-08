"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { services, insuranceProviders } from "@/data/services";
import { NORMALIZED_AMENITIES } from "@/lib/directory/amenity-map";
import { cn } from "@/lib/utils";

interface FilterSidebarContentProps {
  className?: string;
}

export function FilterSidebarContent({ className }: FilterSidebarContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParams(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function toggleArrayParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    const current = params.get(key)?.split(",").filter(Boolean) ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    if (next.length === 0) {
      params.delete(key);
    } else {
      params.set(key, next.join(","));
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function isChecked(key: string, value: string) {
    const current = searchParams.get(key)?.split(",") ?? [];
    return current.includes(value);
  }

  const currentRating = searchParams.get("rating") ?? "any";

  return (
    <div className={cn("space-y-5", className)}>
      {/* Specialty */}
      <section>
        <h3 className="font-semibold text-sm mb-3">Specialty</h3>
        <div className="space-y-2">
          {services.map((service) => (
            <div key={service.type} className="flex items-center space-x-2">
              <Checkbox
                id={`sp-${service.type}`}
                checked={isChecked("specialty", service.type)}
                onCheckedChange={() =>
                  toggleArrayParam("specialty", service.type)
                }
              />
              <Label
                htmlFor={`sp-${service.type}`}
                className="text-sm font-normal cursor-pointer"
              >
                {service.name}
              </Label>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Insurance */}
      <section>
        <h3 className="font-semibold text-sm mb-3">Insurance</h3>
        <div className="space-y-2">
          {insuranceProviders.map((ins) => (
            <div key={ins.type} className="flex items-center space-x-2">
              <Checkbox
                id={`ins-${ins.type}`}
                checked={isChecked("insurance", ins.type)}
                onCheckedChange={() => toggleArrayParam("insurance", ins.type)}
              />
              <Label
                htmlFor={`ins-${ins.type}`}
                className="text-sm font-normal cursor-pointer"
              >
                {ins.name}
              </Label>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Rating */}
      <section>
        <h3 className="font-semibold text-sm mb-3">Rating</h3>
        <RadioGroup
          value={currentRating}
          onValueChange={(val) =>
            updateParams("rating", val === "any" ? null : val)
          }
          className="space-y-2"
        >
          {[
            { value: "4", label: "4+ Stars" },
            { value: "3", label: "3+ Stars" },
            { value: "any", label: "Any Rating" },
          ].map((opt) => (
            <div key={opt.value} className="flex items-center space-x-2">
              <RadioGroupItem value={opt.value} id={`rt-${opt.value}`} />
              <Label
                htmlFor={`rt-${opt.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </section>

      <Separator />

      {/* Amenities */}
      <section>
        <h3 className="font-semibold text-sm mb-3">Amenities</h3>
        <div className="space-y-2">
          {NORMALIZED_AMENITIES.slice(0, 6).map((amenity) => (
            <div key={amenity.slug} className="flex items-center space-x-2">
              <Checkbox
                id={`am-${amenity.slug}`}
                checked={isChecked("amenity", amenity.slug)}
                onCheckedChange={() =>
                  toggleArrayParam("amenity", amenity.slug)
                }
              />
              <Label
                htmlFor={`am-${amenity.slug}`}
                className="text-sm font-normal cursor-pointer"
              >
                {amenity.label}
              </Label>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Toggles */}
      <section>
        <h3 className="font-semibold text-sm mb-3">Status</h3>
        <div className="space-y-3">
          {[
            { key: "verified", label: "Verified Only" },
            { key: "has-reviews", label: "Has Reviews" },
            { key: "open-now", label: "Open Now" },
          ].map((toggle) => (
            <div
              key={toggle.key}
              className="flex items-center justify-between"
            >
              <Label
                htmlFor={`toggle-${toggle.key}`}
                className="text-sm font-normal cursor-pointer"
              >
                {toggle.label}
              </Label>
              <Switch
                id={`toggle-${toggle.key}`}
                checked={searchParams.get(toggle.key) === "true"}
                onCheckedChange={(checked) =>
                  updateParams(toggle.key, checked ? "true" : null)
                }
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Desktop sticky sidebar wrapper for filters.
 */
export function FilterSidebar() {
  return (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-20 rounded-lg border bg-card p-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <h2 className="font-semibold text-base mb-4">Filters</h2>
        <FilterSidebarContent />
      </div>
    </aside>
  );
}
