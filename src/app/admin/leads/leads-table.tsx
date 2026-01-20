"use client";

import Link from "next/link";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  UserCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { needsFollowUp } from "@/lib/lead-utils";
import type { LeadWithDetails } from "@/lib/lead-queries";

interface LeadsTableProps {
  leads: LeadWithDetails[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "new":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          <Clock className="h-3 w-3 mr-1" />
          New
        </Badge>
      );
    case "contacted":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        >
          <Mail className="h-3 w-3 mr-1" />
          Contacted
        </Badge>
      );
    case "qualified":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        >
          <UserCheck className="h-3 w-3 mr-1" />
          Qualified
        </Badge>
      );
    case "closed":
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
        >
          <XCircle className="h-3 w-3 mr-1" />
          Closed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function FollowUpIndicator({ lead }: { lead: LeadWithDetails }) {
  if (lead.followedUpAt) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">
                {formatShortDate(lead.followedUpAt)}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Followed up on {formatDate(lead.followedUpAt)}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (needsFollowUp(lead)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1 text-orange-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Overdue</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            No follow-up sent - submitted {formatDate(lead.createdAt)}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (lead.followUpDate) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">
                {formatShortDate(lead.followUpDate)}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Follow-up scheduled for {formatDate(lead.followUpDate)}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <span className="text-muted-foreground text-xs">-</span>;
}

export function LeadsTable({ leads }: LeadsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Submitted</TableHead>
            <TableHead>Clinic</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Follow-up</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-muted/50">
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {formatDate(lead.createdAt)}
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="font-medium hover:underline block"
                >
                  {lead.clinic.title}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {lead.clinic.city}, {lead.clinic.stateAbbreviation}
                </span>
              </TableCell>
              <TableCell>
                <div className="font-medium">{lead.patientName}</div>
                <div className="text-sm text-muted-foreground">
                  {lead.painType}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate max-w-[150px]">
                    {lead.patientEmail}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {lead.patientPhone}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(lead.status)}</TableCell>
              <TableCell>
                <FollowUpIndicator lead={lead} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
