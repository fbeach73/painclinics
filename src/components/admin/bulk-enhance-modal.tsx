'use client';

import { useState, useRef } from 'react';
import { Sparkles, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BulkEnhanceModalProps {
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

export function BulkEnhanceModal({
  clinicIds,
  clinicNames,
  open,
  onOpenChange,
  onComplete,
}: BulkEnhanceModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, error: 0, skipped: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStart = async () => {
    setIsProcessing(true);
    setIsComplete(false);
    setProgress({ current: 0, total: clinicIds.length, success: 0, error: 0, skipped: 0 });
    setLogs([]);
    abortControllerRef.current = new AbortController();

    for (let i = 0; i < clinicIds.length; i++) {
      if (abortControllerRef.current?.signal.aborted) break;

      const clinicId = clinicIds[i]!;
      const clinicName = clinicNames.get(clinicId) ?? 'Unknown Clinic';

      try {
        const response = await fetch(`/api/admin/clinics/${clinicId}/enhance-about`, {
          method: 'POST',
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
              { clinicId, clinicName, status: 'skipped', message: 'Already has enhanced content' },
            ]);
          } else {
            setProgress((prev) => ({
              ...prev,
              current: i + 1,
              success: prev.success + 1,
            }));
            setLogs((prev) => [
              ...prev,
              { clinicId, clinicName, status: 'success' },
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
            { clinicId, clinicName, status: 'error', message: data.error || 'Failed to enhance' },
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

      // Small delay between requests to avoid rate limiting
      if (i < clinicIds.length - 1 && !abortControllerRef.current?.signal.aborted) {
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
      onOpenChange(false);
    }
  };

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => isProcessing && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Bulk Content Enhancement
          </DialogTitle>
          <DialogDescription>
            {isProcessing
              ? 'Enhancing clinic content with AI...'
              : isComplete
                ? 'Enhancement complete!'
                : `Ready to enhance ${clinicIds.length} clinic(s) with AI-generated content.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Section */}
          {(isProcessing || isComplete) && (
            <div className="space-y-3">
              <Progress value={progressPercent} className="h-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {progress.current} of {progress.total} processed
                </span>
                <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-green-500/10 p-2">
                  <div className="text-lg font-semibold text-green-600">{progress.success}</div>
                  <div className="text-xs text-muted-foreground">Success</div>
                </div>
                <div className="rounded-md bg-yellow-500/10 p-2">
                  <div className="text-lg font-semibold text-yellow-600">{progress.skipped}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
                <div className="rounded-md bg-red-500/10 p-2">
                  <div className="text-lg font-semibold text-red-600">{progress.error}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>

              {/* Log List */}
              {logs.length > 0 && (
                <ScrollArea className="h-48 rounded-md border">
                  <div className="p-3 space-y-2">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        {log.status === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        ) : log.status === 'skipped' ? (
                          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate block">{log.clinicName}</span>
                          {log.message && (
                            <span className="text-muted-foreground text-xs">{log.message}</span>
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
                This will generate AI-enhanced descriptions for the selected clinics.
                Clinics that already have enhanced content will be skipped.
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
                <Button onClick={handleStart}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Enhancement
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
