'use client';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { reliefCategories } from '@/data/pain-relief-methods';
import { cn } from '@/lib/utils';
import type { PainReliefMethod } from '@/types/pain-relief';
import { CostIndicator } from './cost-indicator';
import { EffectivenessStars } from './effectiveness-stars';

interface ReliefMethodTableProps {
  methods: PainReliefMethod[];
  selectedMethods: string[];
  onToggleSelection: (methodId: string) => void;
  maxSelections: number;
}

export function ReliefMethodTable({
  methods,
  selectedMethods,
  onToggleSelection,
  maxSelections,
}: ReliefMethodTableProps) {
  const isMaxReached = selectedMethods.length >= maxSelections;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Compare</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead>Effectiveness</TableHead>
            <TableHead className="hidden md:table-cell">Time to Relief</TableHead>
            <TableHead className="hidden lg:table-cell">Duration</TableHead>
            <TableHead>Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {methods.map((method) => {
            const isSelected = selectedMethods.includes(method.id);
            const isDisabled = !isSelected && isMaxReached;

            return (
              <TableRow
                key={method.id}
                className={cn(
                  isSelected && 'bg-primary/5',
                  isDisabled && 'opacity-50'
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => onToggleSelection(method.id)}
                    aria-label={`Add ${method.name} to comparison`}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{method.name}</div>
                  <div className="text-sm text-muted-foreground sm:hidden">
                    {reliefCategories[method.category].name}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline">{reliefCategories[method.category].name}</Badge>
                </TableCell>
                <TableCell>
                  <EffectivenessStars rating={method.effectiveness} />
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {method.timeToRelief}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  {method.durationOfRelief}
                </TableCell>
                <TableCell>
                  <CostIndicator cost={method.cost} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {methods.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No methods match your current filters. Try adjusting your selections.
        </div>
      )}
    </div>
  );
}
