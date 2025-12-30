import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function BroadcastNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Mail className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>Broadcast Not Found</CardTitle>
          <CardDescription>
            The broadcast you&apos;re looking for doesn&apos;t exist or may have been deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Check the URL or go back to the broadcasts list to find what you&apos;re looking for.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/admin/broadcasts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Broadcasts
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
