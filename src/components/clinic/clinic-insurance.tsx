import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getInsuranceByType } from '@/data/services';
import { cn } from '@/lib/utils';
import type { InsuranceType } from '@/types/clinic';

interface ClinicInsuranceProps {
  insurance: InsuranceType[];
  className?: string;
}

export function ClinicInsurance({ insurance, className }: ClinicInsuranceProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Insurance Accepted</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('flex flex-wrap gap-2')}>
          {insurance.map((insuranceType) => {
            const insuranceInfo = getInsuranceByType(insuranceType);
            if (!insuranceInfo) return null;

            return (
              <Badge key={insuranceType} variant="outline">
                {insuranceInfo.name}
              </Badge>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Please verify insurance coverage directly with the clinic before your visit.
        </p>
      </CardContent>
    </Card>
  );
}
