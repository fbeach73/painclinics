"use client";

import {
  Syringe,
  Zap,
  Cpu,
  Activity,
  Pill,
  Brain,
  Target,
  Hand,
  Leaf,
  Radio,
  Droplet,
  Bone,
  Circle,
  Waves,
  Scan,
  ClipboardList,
  Gauge,
  MessageCircle,
  Monitor,
  Moon,
  Briefcase,
  Spline,
  Building2,
  HeartPulse,
  Scissors,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Map of available icon names to their components
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  Syringe,
  Zap,
  Cpu,
  Activity,
  Pill,
  Brain,
  Target,
  Hand,
  Leaf,
  Radio,
  Droplet,
  Bone,
  Circle,
  Waves,
  Scan,
  ClipboardList,
  Gauge,
  MessageCircle,
  Monitor,
  Moon,
  Briefcase,
  Spline,
  Building2,
  HeartPulse,
  Scissors,
  Stethoscope,
};

// Grouped icons for better organization in the picker
const ICON_GROUPS = [
  {
    label: "Medical",
    icons: ["Syringe", "Pill", "Droplet", "Bone", "Stethoscope", "HeartPulse"],
  },
  {
    label: "Procedures",
    icons: ["Zap", "Cpu", "Radio", "Monitor", "Scissors"],
  },
  {
    label: "Physical",
    icons: ["Activity", "Hand", "Waves", "Spline"],
  },
  {
    label: "Diagnostic",
    icons: ["Scan", "ClipboardList", "Gauge", "Target"],
  },
  {
    label: "Support",
    icons: ["Brain", "MessageCircle", "Moon", "Briefcase"],
  },
  {
    label: "Other",
    icons: ["Leaf", "Circle", "Building2"],
  },
];

interface ServiceIconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  disabled?: boolean;
}

export function ServiceIconPicker({
  value,
  onChange,
  disabled,
}: ServiceIconPickerProps) {
  const SelectedIcon = value ? SERVICE_ICONS[value] : null;

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled ?? false}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an icon">
          {SelectedIcon && (
            <span className="flex items-center gap-2">
              <SelectedIcon className="h-4 w-4" />
              <span>{value}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ICON_GROUPS.map((group) => (
          <SelectGroup key={group.label}>
            <SelectLabel>{group.label}</SelectLabel>
            {group.icons.map((iconName) => {
              const Icon = SERVICE_ICONS[iconName];
              if (!Icon) return null;
              return (
                <SelectItem key={iconName} value={iconName}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{iconName}</span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

// Helper function to get an icon component by name
export function getServiceIcon(iconName: string): LucideIcon | null {
  return SERVICE_ICONS[iconName] || null;
}
