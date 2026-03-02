import { BillingClient } from "./billing-client";

export default function BillingPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">DB Billing</h1>
        <p className="text-muted-foreground">
          Neon database usage and estimated costs
        </p>
      </div>
      <BillingClient />
    </div>
  );
}
