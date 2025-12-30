'use client';

import { X, Clock, Timer, AlertTriangle, CheckCircle, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { reliefCategories } from '@/data/pain-relief-methods';
import type { PainReliefMethod } from '@/types/pain-relief';
import { CostIndicator } from './cost-indicator';
import { EffectivenessStars } from './effectiveness-stars';

interface MethodDetailCardProps {
  method: PainReliefMethod;
  onRemove: () => void;
}

export function MethodDetailCard({ method, onRemove }: MethodDetailCardProps) {
  return (
    <Card className="w-[320px] flex-shrink-0">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{method.name}</CardTitle>
            <Badge variant="outline" className="mt-1">
              {reliefCategories[method.category].name}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRemove}
            aria-label={`Remove ${method.name} from comparison`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Image Placeholder */}
        <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-xs text-center p-4 gap-2">
            <ImageIcon className="h-8 w-8 opacity-50" />
            <span className="line-clamp-2">{method.imagePlaceholder}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Effectiveness</p>
            <EffectivenessStars rating={method.effectiveness} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Cost</p>
            <CostIndicator cost={method.cost} />
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{method.timeToRelief}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span>{method.durationOfRelief}</span>
          </div>
        </div>

        <Separator />

        {/* When to Use */}
        <div>
          <h4 className="font-medium text-sm flex items-center gap-1.5 mb-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            When to Use
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {method.whenToUse.slice(0, 3).map((use, i) => (
              <li key={i} className="truncate">
                &bull; {use}
              </li>
            ))}
            {method.whenToUse.length > 3 && (
              <li className="text-xs">+{method.whenToUse.length - 3} more...</li>
            )}
          </ul>
        </div>

        {/* When NOT to Use */}
        <div>
          <h4 className="font-medium text-sm flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Avoid If
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {method.whenNotToUse.slice(0, 3).map((avoid, i) => (
              <li key={i} className="truncate">
                &bull; {avoid}
              </li>
            ))}
            {method.whenNotToUse.length > 3 && (
              <li className="text-xs">+{method.whenNotToUse.length - 3} more...</li>
            )}
          </ul>
        </div>

        <Separator />

        {/* How to Apply */}
        <div>
          <h4 className="font-medium text-sm mb-2">How to Apply</h4>
          <p className="text-sm text-muted-foreground line-clamp-4">{method.howToApply}</p>
        </div>
      </CardContent>
    </Card>
  );
}
