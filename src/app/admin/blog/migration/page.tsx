import { MigrationWizard } from "@/components/admin/blog/migration-wizard";

export default function BlogMigrationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WordPress Blog Migration</h1>
        <p className="text-muted-foreground mt-1">
          Import blog posts from painclinics.com WordPress site
        </p>
      </div>
      <MigrationWizard />
    </div>
  );
}
