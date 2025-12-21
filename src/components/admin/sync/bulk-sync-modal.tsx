'use client';

import { useState, useRef } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  Phone,
  Star,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

interface BulkSyncModalProps {
  clinicIds: string[];
  clinicNames: Map<string, string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface LogEntry {
  clinicId: string;
  clinicName: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
}

type SyncFieldType = 'reviews' | 'hours' | 'contact' | 'location';

const SYNC_FIELD_OPTIONS: {
  id: SyncFieldType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'reviews',
    label: 'Reviews',
    description: 'Rating, review count, and featured reviews',
    icon: <Star className="h-4 w-4" />,
  },
  {
    id: 'hours',
    label: 'Hours',
    description: 'Business hours and opening times',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    id: 'contact',
    label: 'Contact',
    description: 'Phone number and website URL',
    icon: <Phone className="h-4 w-4" />,
  },
  {
    id: 'location',
    label: 'Location',
    description: 'Address and coordinates',
    icon: <MapPin className="h-4 w-4" />,
  },
];

export function BulkSyncModal({
  clinicIds,
  clinicNames,
  open,
  onOpenChange,
  onComplete,
}: BulkSyncModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    success: 0,
    error: 0,
    skipped: 0,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedFields, setSelectedFields] = useState<Set<SyncFieldType>>(
    new Set(['reviews', 'hours', 'contact', 'location'])
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const toggleField = (field: SyncFieldType) => {
    const newSet = new Set(selectedFields);
    if (newSet.has(field)) {
      newSet.delete(field);
    } else {
      newSet.add(field);
    }
    setSelectedFields(newSet);
  };

  const handleStart = async () => {
    if (selectedFields.size === 0) return;

    setIsProcessing(true);
    setIsComplete(false);
    setProgress({
      current: 0,
      total: clinicIds.length,
      success: 0,
      error: 0,
      skipped: 0,
    });
    setLogs([]);
    abortControllerRef.current = new AbortController();

    // Process clinics one by one for better progress feedback
    for (let i = 0; i < clinicIds.length; i++) {
      if (abortControllerRef.current?.signal.aborted) break;

      const clinicId = clinicIds[i]!;
      const clinicName = clinicNames.get(clinicId) ?? 'Unknown Clinic';

      try {
        const response = await fetch(`/api/admin/clinics/${clinicId}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: Array.from(selectedFields) }),
          signal: abortControllerRef.current.signal,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.skipped) {
            setProgress((prev) => ({
              ...prev,
              current: i + 1,
              skipped: prev.skipped + 1,
            }));
            setLogs((prev) => [
              ...prev,
              {
                clinicId,
                clinicName,
                status: 'skipped',
                message: data.reason || 'No Place ID or skipped',
              },
            ]);
          } else {
            setProgress((prev) => ({
              ...prev,
              current: i + 1,
              success: prev.success + 1,
            }));
            setLogs((prev) => [
              ...prev,
              {
                clinicId,
                clinicName,
                status: 'success',
                message: `Updated ${data.changes?.length ?? 0} field(s)`,
              },
            ]);
          }
        } else {
          const data = await response.json().catch(() => ({}));
          setProgress((prev) => ({
            ...prev,
            current: i + 1,
            error: prev.error + 1,
          }));
          setLogs((prev) => [
            ...prev,
            {
              clinicId,
              clinicName,
              status: 'error',
              message: data.error || 'Failed to sync',
            },
          ]);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') break;
        setProgress((prev) => ({
          ...prev,
          current: i + 1,
          error: prev.error + 1,
        }));
        setLogs((prev) => [
          ...prev,
          { clinicId, clinicName, status: 'error', message: 'Request failed' },
        ]);
      }

      // Delay between requests to avoid rate limiting
      if (
        i < clinicIds.length - 1 &&
        !abortControllerRef.current?.signal.aborted
      ) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setIsProcessing(false);
    setIsComplete(true);
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setIsProcessing(false);
  };

  const handleClose = () => {
    if (!isProcessing) {
      if (isComplete) {
        onComplete();
      }
      setIsComplete(false);
      setProgress({ current: 0, total: 0, success: 0, error: 0, skipped: 0 });
      setLogs([]);
      setSelectedFields(new Set(['reviews', 'hours', 'contact', 'location']));
      onOpenChange(false);
    }
  };

  const progressPercent =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => isProcessing && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Bulk Google Places Sync
          </DialogTitle>
          <DialogDescription>
            {isProcessing
              ? 'Syncing clinic data from Google Places...'
              : isComplete
                ? 'Sync complete!'
                : `Ready to sync ${clinicIds.length} clinic(s) with Google Places data.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Field Selection (only shown before processing) */}
          {!isProcessing && !isComplete && (
            <div className="space-y-3">
              <Label>Select fields to sync:</Label>
              <div className="grid grid-cols-2 gap-2">
                {SYNC_FIELD_OPTIONS.map((field) => (
                  <label
                    key={field.id}
                    className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedFields.has(field.id)}
                      onCheckedChange={() => toggleField(field.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        {field.icon}
                        {field.label}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {field.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Progress Section */}
          {(isProcessing || isComplete) && (
            <div className="space-y-3">
              <Progress value={progressPercent} className="h-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {progress.current} of {progress.total} processed
                </span>
                <span className="text-muted-foreground">
                  {Math.round(progressPercent)}%
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-green-500/10 p-2">
                  <div className="text-lg font-semibold text-green-600">
                    {progress.success}
                  </div>
                  <div className="text-xs text-muted-foreground">Success</div>
                </div>
                <div className="rounded-md bg-yellow-500/10 p-2">
                  <div className="text-lg font-semibold text-yellow-600">
                    {progress.skipped}
                  </div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
                <div className="rounded-md bg-red-500/10 p-2">
                  <div className="text-lg font-semibold text-red-600">
                    {progress.error}
                  </div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>

              {/* Log List */}
              {logs.length > 0 && (
                <ScrollArea className="h-48 rounded-md border">
                  <div className="p-3 space-y-2">
                    {logs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        ) : log.status === 'skipped' ? (
                          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate block">
                            {log.clinicName}
                          </span>
                          {log.message && (
                            <span className="text-muted-foreground text-xs">
                              {log.message}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Pre-start Info */}
          {!isProcessing && !isComplete && (
            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="text-muted-foreground">
                This will fetch the latest data from Google Places for the
                selected clinics. Clinics without a Place ID will be skipped.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {isProcessing ? (
              <Button variant="destructive" onClick={handleCancel}>
                Cancel
              </Button>
            ) : isComplete ? (
              <Button onClick={handleClose}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleStart}
                  disabled={selectedFields.size === 0}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start Sync
                </Button>
              </>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
