import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getInsuranceByType, getPaymentMethodBySlug } from '@/data/services';
import { cn } from '@/lib/utils';
import type { InsuranceType } from '@/types/clinic';

interface ClinicInsuranceProps {
  insurance: InsuranceType[];
  paymentMethods?: string[] | undefined;
  className?: string;
}

export function ClinicInsurance({ insurance, paymentMethods, className }: ClinicInsuranceProps) {
  const hasInsurance = insurance.length > 0;
  const hasPaymentMethods = paymentMethods && paymentMethods.length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Insurance & Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasInsurance && (
          <div>
            <h4 className="text-sm font-medium mb-2">Insurance Accepted</h4>
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
          </div>
        )}

        {hasPaymentMethods && (
          <div>
            <h4 className="text-sm font-medium mb-2">Payment Methods</h4>
            <div className={cn('flex flex-wrap gap-2')}>
              {paymentMethods.map((slug) => {
                const method = getPaymentMethodBySlug(slug);
                return (
                  <Badge key={slug} variant="secondary">
                    {method?.label ?? slug}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Please verify insurance coverage and payment options directly with the clinic before your visit.
        </p>
      </CardContent>
    </Card>
  );
}
