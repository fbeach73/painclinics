'use client';

import { useState } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { PainReliefMethod } from '@/types/pain-relief';
import { MethodDetailCard } from './method-detail-card';

interface ComparisonPanelProps {
  methods: PainReliefMethod[];
  onRemove: (methodId: string) => void;
  onClearAll: () => void;
}

export function ComparisonPanel({ methods, onRemove, onClearAll }: ComparisonPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <section className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-40">
      {/* Header - always visible */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 h-auto"
              aria-label={isCollapsed ? 'Expand comparison panel' : 'Collapse comparison panel'}
            >
              {isCollapsed ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
            <h2 className="text-lg font-semibold">
              Comparing {methods.length} Method{methods.length !== 1 ? 's' : ''}
            </h2>
            {/* Show method names as badges when collapsed */}
            {isCollapsed && (
              <div className="hidden sm:flex items-center gap-2 ml-2">
                {methods.map((method) => (
                  <Badge key={method.id} variant="secondary" className="text-xs">
                    {method.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Expandable content */}
      {!isCollapsed && (
        <div className="container mx-auto px-4 pb-4 max-h-[45vh] overflow-hidden">
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {methods.map((method) => (
                <MethodDetailCard
                  key={method.id}
                  method={method}
                  onRemove={() => onRemove(method.id)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </section>
  );
}
