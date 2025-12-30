import { FileEdit, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BroadcastStatusBadgeProps {
  status: string | null;
}

export function BroadcastStatusBadge({ status }: BroadcastStatusBadgeProps) {
  switch (status) {
    case "draft":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
          <FileEdit className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      );
    case "sending":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Sending
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status || "Unknown"}</Badge>;
  }
}
