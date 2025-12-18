import { UrlValidationClient } from "./url-validation-client";

export default function UrlValidationPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">URL Validation</h1>
        <p className="text-muted-foreground">
          Validate and fix clinic permalink URLs for SEO integrity
        </p>
      </div>
      <UrlValidationClient />
    </div>
  );
}
