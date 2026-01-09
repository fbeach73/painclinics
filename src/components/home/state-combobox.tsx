'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface USState {
  abbrev: string;
  name: string;
  slug: string;
}

export const US_STATES: USState[] = [
  { abbrev: 'AL', name: 'Alabama', slug: 'al' },
  { abbrev: 'AK', name: 'Alaska', slug: 'ak' },
  { abbrev: 'AZ', name: 'Arizona', slug: 'az' },
  { abbrev: 'AR', name: 'Arkansas', slug: 'ar' },
  { abbrev: 'CA', name: 'California', slug: 'ca' },
  { abbrev: 'CO', name: 'Colorado', slug: 'co' },
  { abbrev: 'CT', name: 'Connecticut', slug: 'ct' },
  { abbrev: 'DE', name: 'Delaware', slug: 'de' },
  { abbrev: 'FL', name: 'Florida', slug: 'fl' },
  { abbrev: 'GA', name: 'Georgia', slug: 'ga' },
  { abbrev: 'HI', name: 'Hawaii', slug: 'hi' },
  { abbrev: 'ID', name: 'Idaho', slug: 'id' },
  { abbrev: 'IL', name: 'Illinois', slug: 'il' },
  { abbrev: 'IN', name: 'Indiana', slug: 'in' },
  { abbrev: 'IA', name: 'Iowa', slug: 'ia' },
  { abbrev: 'KS', name: 'Kansas', slug: 'ks' },
  { abbrev: 'KY', name: 'Kentucky', slug: 'ky' },
  { abbrev: 'LA', name: 'Louisiana', slug: 'la' },
  { abbrev: 'ME', name: 'Maine', slug: 'me' },
  { abbrev: 'MD', name: 'Maryland', slug: 'md' },
  { abbrev: 'MA', name: 'Massachusetts', slug: 'ma' },
  { abbrev: 'MI', name: 'Michigan', slug: 'mi' },
  { abbrev: 'MN', name: 'Minnesota', slug: 'mn' },
  { abbrev: 'MS', name: 'Mississippi', slug: 'ms' },
  { abbrev: 'MO', name: 'Missouri', slug: 'mo' },
  { abbrev: 'MT', name: 'Montana', slug: 'mt' },
  { abbrev: 'NE', name: 'Nebraska', slug: 'ne' },
  { abbrev: 'NV', name: 'Nevada', slug: 'nv' },
  { abbrev: 'NH', name: 'New Hampshire', slug: 'nh' },
  { abbrev: 'NJ', name: 'New Jersey', slug: 'nj' },
  { abbrev: 'NM', name: 'New Mexico', slug: 'nm' },
  { abbrev: 'NY', name: 'New York', slug: 'ny' },
  { abbrev: 'NC', name: 'North Carolina', slug: 'nc' },
  { abbrev: 'ND', name: 'North Dakota', slug: 'nd' },
  { abbrev: 'OH', name: 'Ohio', slug: 'oh' },
  { abbrev: 'OK', name: 'Oklahoma', slug: 'ok' },
  { abbrev: 'OR', name: 'Oregon', slug: 'or' },
  { abbrev: 'PA', name: 'Pennsylvania', slug: 'pa' },
  { abbrev: 'RI', name: 'Rhode Island', slug: 'ri' },
  { abbrev: 'SC', name: 'South Carolina', slug: 'sc' },
  { abbrev: 'SD', name: 'South Dakota', slug: 'sd' },
  { abbrev: 'TN', name: 'Tennessee', slug: 'tn' },
  { abbrev: 'TX', name: 'Texas', slug: 'tx' },
  { abbrev: 'UT', name: 'Utah', slug: 'ut' },
  { abbrev: 'VT', name: 'Vermont', slug: 'vt' },
  { abbrev: 'VA', name: 'Virginia', slug: 'va' },
  { abbrev: 'WA', name: 'Washington', slug: 'wa' },
  { abbrev: 'WV', name: 'West Virginia', slug: 'wv' },
  { abbrev: 'WI', name: 'Wisconsin', slug: 'wi' },
  { abbrev: 'WY', name: 'Wyoming', slug: 'wy' },
];

// Mapping from abbreviation to full name for easy lookup
export const STATE_NAMES: Record<string, string> = Object.fromEntries(
  US_STATES.map((state) => [state.abbrev, state.name])
);

// Mapping from state name to slug
export const stateNameToSlug = (stateName: string): string | undefined => {
  const state = US_STATES.find(
    (s) => s.name.toLowerCase() === stateName.toLowerCase()
  );
  return state?.slug;
};

interface StateComboboxProps {
  className?: string;
  placeholder?: string;
}

export function StateCombobox({
  className,
  placeholder = 'Search for a state...',
}: StateComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');
  const router = useRouter();

  const handleSelect = (currentValue: string) => {
    setValue(currentValue);
    setOpen(false);

    const selectedState = US_STATES.find(
      (state) => state.abbrev.toLowerCase() === currentValue.toLowerCase()
    );

    if (selectedState) {
      router.push(`/pain-management/${selectedState.slug}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {value
              ? US_STATES.find(
                  (state) =>
                    state.abbrev.toLowerCase() === value.toLowerCase()
                )?.name
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Type to search states..." />
          <CommandList>
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {US_STATES.map((state) => (
                <CommandItem
                  key={state.abbrev}
                  value={`${state.name} ${state.abbrev}`}
                  onSelect={() => handleSelect(state.abbrev)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value.toLowerCase() === state.abbrev.toLowerCase()
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {state.name}
                  <span className="ml-auto text-muted-foreground">
                    {state.abbrev}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
