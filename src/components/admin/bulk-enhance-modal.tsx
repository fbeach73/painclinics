'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  SkipForward,
  FileText,
  HelpCircle,
  Building2,
  Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface BulkEnhanceModalProps {
  clinicIds: string[];
  clinicNames: Map<string, string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type EnhancementType = 'content' | 'services' | 'faq' | 'amenities';

interface EnhancementConfig {
  key: EnhancementType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface EnhancementStats {
  success: number;
  skipped: number;
  error: number;
}

interface EnhancementResult {
  type: EnhancementType;
  status: 'success' | 'error' | 'skipped';
  message?: string;
  servicesApplied?: number;
}

interface LogEntry {
  clinicId: string;
  clinicName: string;
  results: EnhancementResult[];
}

const ENHANCEMENT_CONFIGS: EnhancementConfig[] = [
  {
    key: 'content',
    label: 'Content',
    description: 'AI-enhanced descriptions',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    key: 'faq',
    label: 'FAQ',
    description: 'Generate Q&A from clinic data',
    icon: <HelpCircle className="h-4 w-4" />,
  },
  {
    key: 'amenities',
    label: 'Amenities',
    description: 'Extract from reviews',
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    key: 'services',
    label: 'Services',
    description: 'Auto-apply high + medium confidence',
    icon: <Wrench className="h-4 w-4" />,
  },
];

export function BulkEnhanceModal({
  clinicIds,
  clinicNames,
  open,
  onOpenChange,
  onComplete,
}: BulkEnhanceModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch full clinic names for all selected IDs (fixes "Unknown Clinic" issue)
  const [fetchedClinicNames, setFetchedClinicNames] = useState<Map<string, string> | null>(null);

  useEffect(() => {
    if (!open || clinicIds.length === 0) {
      setFetchedClinicNames(null);
      return;
    }

    const fetchClinicNames = async () => {
      try {
        const response = await fetch('/api/admin/clinics/bulk-names', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clinicIds }),
        });

        if (response.ok) {
          const data = await response.json();
          const map = new Map<string, string>(
            data.clinics.map((c: { id: string; title: string }) => [c.id, c.title])
          );
          setFetchedClinicNames(map);
        }
      } catch (error) {
        console.error('Failed to fetch clinic names:', error);
        // Fall back to the provided clinicNames map
        setFetchedClinicNames(clinicNames);
      }
    };

    fetchClinicNames();
  }, [open, clinicIds]);

  // Use fetched names if available, otherwise fall back to provided map
  const effectiveClinicNames = fetchedClinicNames || clinicNames;

  // Enhancement selection state
  const [selectedTypes, setSelectedTypes] = useState<Set<EnhancementType>>(
    new Set(['content', 'faq', 'amenities', 'services'])
  );
  const [skipExisting, setSkipExisting] = useState(true);

  // Per-type stats
  const [stats, setStats] = useState<Record<EnhancementType, EnhancementStats>>({
    content: { success: 0, skipped: 0, error: 0 },
    services: { success: 0, skipped: 0, error: 0 },
    faq: { success: 0, skipped: 0, error: 0 },
    amenities: { success: 0, skipped: 0, error: 0 },
  });

  const toggleEnhancementType = (type: EnhancementType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Process content enhancement
  const processContent = async (
    clinicId: string,
    signal: AbortSignal
  ): Promise<EnhancementResult> => {
    try {
      const url = skipExisting
        ? `/api/admin/clinics/${clinicId}/enhance-about`
        : `/api/admin/clinics/${clinicId}/enhance-about?force=true`;
      const response = await fetch(url, { method: 'POST', signal });

      if (response.ok) {
        const data = await response.json();
        if (data.skipped) {
          return { type: 'content', status: 'skipped', message: 'Has content' };
        }
        return { type: 'content', status: 'success' };
      } else {
        const data = await response.json().catch(() => ({}));
        return { type: 'content', status: 'error', message: data.error || 'Failed' };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      return { type: 'content', status: 'error', message: 'Request failed' };
    }
  };

  // Process FAQ generation
  const processFAQ = async (
    clinicId: string,
    signal: AbortSignal
  ): Promise<EnhancementResult> => {
    try {
      const url = skipExisting
        ? `/api/admin/clinics/${clinicId}/generate-faq`
        : `/api/admin/clinics/${clinicId}/generate-faq?force=true`;
      const response = await fetch(url, { method: 'POST', signal });

      if (response.ok) {
        const data = await response.json();
        if (data.skipped) {
          return { type: 'faq', status: 'skipped', message: 'Has FAQs' };
        }
        return { type: 'faq', status: 'success', message: `${data.faqCount || 0} FAQs` };
      } else {
        const data = await response.json().catch(() => ({}));
        return { type: 'faq', status: 'error', message: data.error || 'Failed' };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      return { type: 'faq', status: 'error', message: 'Request failed' };
    }
  };

  // Process amenities extraction
  const processAmenities = async (
    clinicId: string,
    signal: AbortSignal
  ): Promise<EnhancementResult> => {
    try {
      const url = skipExisting
        ? `/api/admin/clinics/${clinicId}/automate-amenities`
        : `/api/admin/clinics/${clinicId}/automate-amenities?force=true`;
      const response = await fetch(url, { method: 'POST', signal });

      if (response.ok) {
        const data = await response.json();
        if (data.skipped) {
          return { type: 'amenities', status: 'skipped', message: 'Has amenities' };
        }
        const count = data.amenities?.length || 0;
        return { type: 'amenities', status: 'success', message: `${count} amenities` };
      } else {
        const data = await response.json().catch(() => ({}));
        return { type: 'amenities', status: 'error', message: data.error || 'Failed' };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      return { type: 'amenities', status: 'error', message: 'Request failed' };
    }
  };

  // Process services - two-step: get suggestions then apply high+medium confidence
  // Note: Services enhancement always gets suggestions (no skip at API level)
  // because we want to ADD new services, not replace existing ones
  const processServices = async (
    clinicId: string,
    signal: AbortSignal
  ): Promise<EnhancementResult> => {
    try {
      // Step 1: Get AI suggestions
      const suggestResponse = await fetch(
        `/api/admin/clinics/${clinicId}/enhance-services`,
        { method: 'POST', signal }
      );

      if (!suggestResponse.ok) {
        const data = await suggestResponse.json().catch(() => ({}));
        return { type: 'services', status: 'error', message: data.error || 'Failed' };
      }

      const suggestions = await suggestResponse.json();

      // Filter to high and medium confidence suggestions
      const existingServices = suggestions.existingServices || [];
      const highMediumServices = existingServices.filter(
        (s: { confidence: string }) => s.confidence === 'high' || s.confidence === 'medium'
      );

      if (highMediumServices.length === 0) {
        return { type: 'services', status: 'skipped', message: 'No confident matches' };
      }

      // Step 2: Get current services to merge
      const currentResponse = await fetch(`/api/admin/services/clinic/${clinicId}`, { signal });
      if (!currentResponse.ok) {
        return { type: 'services', status: 'error', message: 'Failed to get current services' };
      }
      const currentData = await currentResponse.json();
      const currentServices = currentData.services || [];

      // Merge: keep existing services, add new high/medium confidence ones
      const existingIds = new Set(currentServices.map((s: { serviceId: string }) => s.serviceId));
      const newServices = highMediumServices
        .filter((s: { serviceId: string }) => !existingIds.has(s.serviceId))
        .map((s: { serviceId: string }, idx: number) => ({
          serviceId: s.serviceId,
          isFeatured: false,
          displayOrder: currentServices.length + idx,
        }));

      if (newServices.length === 0) {
        return { type: 'services', status: 'skipped', message: 'Already has suggested services' };
      }

      // Combine existing and new services
      const allServices = [
        ...currentServices.map((s: { serviceId: string; isFeatured: boolean }, idx: number) => ({
          serviceId: s.serviceId,
          isFeatured: s.isFeatured,
          displayOrder: idx,
        })),
        ...newServices,
      ];

      // Step 3: Apply the combined services
      const applyResponse = await fetch(`/api/admin/services/clinic/${clinicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: allServices }),
        signal,
      });

      if (!applyResponse.ok) {
        const data = await applyResponse.json().catch(() => ({}));
        return { type: 'services', status: 'error', message: data.error || 'Failed to apply' };
      }

      return {
        type: 'services',
        status: 'success',
        message: `${newServices.length} applied`,
        servicesApplied: newServices.length,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      return { type: 'services', status: 'error', message: 'Request failed' };
    }
  };

  const handleStart = async () => {
    setIsProcessing(true);
    setIsComplete(false);
    setProgress({ current: 0, total: clinicIds.length });
    setLogs([]);
    setStats({
      content: { success: 0, skipped: 0, error: 0 },
      services: { success: 0, skipped: 0, error: 0 },
      faq: { success: 0, skipped: 0, error: 0 },
      amenities: { success: 0, skipped: 0, error: 0 },
    });
    abortControllerRef.current = new AbortController();

    const selectedArray = Array.from(selectedTypes);

    for (let i = 0; i < clinicIds.length; i++) {
      if (abortControllerRef.current?.signal.aborted) break;

      const clinicId = clinicIds[i]!;
      const clinicName = effectiveClinicNames.get(clinicId) ?? 'Unknown Clinic';
      const results: EnhancementResult[] = [];

      try {
        // Process each selected enhancement type sequentially
        for (const type of selectedArray) {
          if (abortControllerRef.current?.signal.aborted) break;

          let result: EnhancementResult;

          switch (type) {
            case 'content':
              result = await processContent(clinicId, abortControllerRef.current.signal);
              break;
            case 'faq':
              result = await processFAQ(clinicId, abortControllerRef.current.signal);
              break;
            case 'amenities':
              result = await processAmenities(clinicId, abortControllerRef.current.signal);
              break;
            case 'services':
              result = await processServices(clinicId, abortControllerRef.current.signal);
              break;
            default:
              continue;
          }

          results.push(result);

          // Update stats for this type
          setStats((prev) => ({
            ...prev,
            [type]: {
              ...prev[type],
              [result.status]: prev[type][result.status] + 1,
            },
          }));

          // Small delay between enhancement types to avoid overwhelming the API
          if (selectedArray.indexOf(type) < selectedArray.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') break;
        // If we hit an error in the loop, add error results for remaining types
      }

      // Add log entry for this clinic
      setLogs((prev) => [...prev, { clinicId, clinicName, results }]);

      // Update progress
      setProgress((prev) => ({ ...prev, current: i + 1 }));

      // Delay between clinics to avoid rate limiting
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
      setProgress({ current: 0, total: 0 });
      setLogs([]);
      setStats({
        content: { success: 0, skipped: 0, error: 0 },
        services: { success: 0, skipped: 0, error: 0 },
        faq: { success: 0, skipped: 0, error: 0 },
        amenities: { success: 0, skipped: 0, error: 0 },
      });
      onOpenChange(false);
    }
  };

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  const getResultBadge = (result: EnhancementResult) => {
    const typeLabel = result.type.charAt(0).toUpperCase() + result.type.slice(1);

    if (result.status === 'success') {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {typeLabel}
          {result.message && <span className="ml-1 opacity-70">({result.message})</span>}
        </Badge>
      );
    } else if (result.status === 'skipped') {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <SkipForward className="h-3 w-3 mr-1" />
          {typeLabel}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
          <XCircle className="h-3 w-3 mr-1" />
          {typeLabel}
          {result.message && <span className="ml-1 opacity-70">({result.message})</span>}
        </Badge>
      );
    }
  };

  const getTotalStats = () => {
    let success = 0;
    let skipped = 0;
    let error = 0;
    for (const type of Array.from(selectedTypes)) {
      success += stats[type].success;
      skipped += stats[type].skipped;
      error += stats[type].error;
    }
    return { success, skipped, error };
  };

  const totalStats = getTotalStats();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-2xl"
        onInteractOutside={(e) => isProcessing && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Bulk AI Enhancement
          </DialogTitle>
          <DialogDescription>
            {isProcessing
              ? 'Enhancing clinics with AI...'
              : isComplete
                ? 'Enhancement complete!'
                : `Ready to enhance ${clinicIds.length} clinic(s) with AI.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Enhancement Selection - Only show before processing */}
          {!isProcessing && !isComplete && (
            <div className="space-y-4">
              <div className="rounded-md border p-4 space-y-3">
                <div className="text-sm font-medium">Select enhancements to run:</div>
                <div className="grid grid-cols-2 gap-3">
                  {ENHANCEMENT_CONFIGS.map((config) => (
                    <div
                      key={config.key}
                      className={cn(
                        'flex items-start space-x-3 rounded-md border p-3 cursor-pointer transition-colors',
                        selectedTypes.has(config.key)
                          ? 'bg-primary/5 border-primary/30'
                          : 'hover:bg-muted/50'
                      )}
                      onClick={() => toggleEnhancementType(config.key)}
                    >
                      <Checkbox
                        id={`enhance-${config.key}`}
                        checked={selectedTypes.has(config.key)}
                        onCheckedChange={() => toggleEnhancementType(config.key)}
                      />
                      <div className="space-y-1 flex-1">
                        <Label
                          htmlFor={`enhance-${config.key}`}
                          className="flex items-center gap-2 cursor-pointer font-medium"
                        >
                          {config.icon}
                          {config.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t">
                  <div
                    className="flex items-center space-x-3 cursor-pointer"
                    onClick={() => setSkipExisting(!skipExisting)}
                  >
                    <Checkbox
                      id="skip-existing"
                      checked={skipExisting}
                      onCheckedChange={(checked) => setSkipExisting(checked === true)}
                    />
                    <Label htmlFor="skip-existing" className="cursor-pointer">
                      <span className="font-medium">Skip clinics with existing data</span>
                      <p className="text-xs text-muted-foreground">
                        Only process clinics that don&apos;t have the selected data already
                      </p>
                    </Label>
                  </div>
                </div>
              </div>

              {selectedTypes.size === 0 && (
                <div className="rounded-md bg-yellow-500/10 p-3 text-sm text-yellow-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Please select at least one enhancement type
                </div>
              )}
            </div>
          )}

          {/* Progress Section */}
          {(isProcessing || isComplete) && (
            <div className="space-y-3">
              <Progress value={progressPercent} className="h-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {progress.current} of {progress.total} clinics processed
                </span>
                <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
              </div>

              {/* Overall Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-green-500/10 p-2">
                  <div className="text-lg font-semibold text-green-600">{totalStats.success}</div>
                  <div className="text-xs text-muted-foreground">Success</div>
                </div>
                <div className="rounded-md bg-yellow-500/10 p-2">
                  <div className="text-lg font-semibold text-yellow-600">{totalStats.skipped}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
                <div className="rounded-md bg-red-500/10 p-2">
                  <div className="text-lg font-semibold text-red-600">{totalStats.error}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>

              {/* Per-Type Stats Grid */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                {ENHANCEMENT_CONFIGS.filter((c) => selectedTypes.has(c.key)).map((config) => (
                  <div key={config.key} className="rounded-md border p-2 text-center">
                    <div className="flex items-center justify-center gap-1 font-medium mb-1">
                      {config.icon}
                      {config.label}
                    </div>
                    <div className="flex justify-center gap-2">
                      <span className="text-green-600">{stats[config.key].success}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-yellow-600">{stats[config.key].skipped}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-red-600">{stats[config.key].error}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Log List */}
              {logs.length > 0 && (
                <ScrollArea className="h-56 rounded-md border">
                  <div className="p-3 space-y-3">
                    {logs.map((log, index) => {
                      const hasError = log.results.some((r) => r.status === 'error');
                      const allSkipped = log.results.every((r) => r.status === 'skipped');

                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            {hasError ? (
                              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                            ) : allSkipped ? (
                              <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            )}
                            <span className="font-medium truncate">{log.clinicName}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 pl-6">
                            {log.results.map((result, rIdx) => (
                              <span key={rIdx}>{getResultBadge(result)}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {isProcessing ? (
              <>
                <Button variant="destructive" onClick={handleCancel}>
                  Cancel
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              </>
            ) : isComplete ? (
              <Button onClick={handleClose}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleStart} disabled={selectedTypes.size === 0}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Enhancement
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
