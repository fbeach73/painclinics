"use client";

import { useState } from "react";
import { FileText, AlertTriangle, X, Play } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ImportPreviewProps {
  preview: Record<string, string>[];
  columns: string[];
  validationErrors: string[];
  fileName: string;
  onStartImport: (duplicateHandling: "skip" | "update" | "overwrite") => void;
  onCancel: () => void;
}

export function ImportPreview({
  preview = [],
  columns = [],
  validationErrors = [],
  fileName,
  onStartImport,
  onCancel,
}: ImportPreviewProps) {
  const [duplicateHandling, setDuplicateHandling] = useState<"skip" | "update" | "overwrite">("update");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const displayColumns = columns.slice(0, 10); // Limit columns for display

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Preview: {fileName}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Review the data before importing. Showing first {preview.length} rows of {columns.length} columns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validation warnings */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Validation Warnings</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2">
                  {validationErrors.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li>...and {validationErrors.length - 5} more warnings</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Column mapping info */}
          <div className="text-sm">
            <p className="font-medium mb-2">Detected Columns ({columns.length}):</p>
            <div className="flex flex-wrap gap-1">
              {columns.slice(0, 20).map((col) => (
                <span
                  key={col}
                  className="px-2 py-0.5 bg-muted rounded text-xs"
                >
                  {col}
                </span>
              ))}
              {columns.length > 20 && (
                <span className="px-2 py-0.5 text-muted-foreground text-xs">
                  +{columns.length - 20} more
                </span>
              )}
            </div>
          </div>

          {/* Data preview table */}
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  {displayColumns.map((col) => (
                    <TableHead key={col} className="min-w-32">
                      {col}
                    </TableHead>
                  ))}
                  {columns.length > 10 && (
                    <TableHead className="text-muted-foreground">
                      +{columns.length - 10} more columns
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    {displayColumns.map((col) => (
                      <TableCell key={col} className="max-w-48 truncate">
                        {row[col] || "-"}
                      </TableCell>
                    ))}
                    {columns.length > 10 && <TableCell>...</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Duplicate handling options */}
          <div className="border rounded-lg p-4">
            <p className="font-medium mb-3">Duplicate Handling</p>
            <RadioGroup
              value={duplicateHandling}
              onValueChange={(value) => setDuplicateHandling(value as "skip" | "update" | "overwrite")}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="update" id="update" />
                <Label htmlFor="update" className="cursor-pointer">
                  <span className="font-medium">Update</span>
                  <span className="text-muted-foreground ml-2">
                    (Merge new data with existing records)
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="skip" id="skip" />
                <Label htmlFor="skip" className="cursor-pointer">
                  <span className="font-medium">Skip</span>
                  <span className="text-muted-foreground ml-2">
                    (Keep existing records, only add new ones)
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="overwrite" id="overwrite" />
                <Label htmlFor="overwrite" className="cursor-pointer">
                  <span className="font-medium">Overwrite</span>
                  <span className="text-muted-foreground ml-2">
                    (Replace existing records completely)
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => setShowConfirmDialog(true)}>
            <Play className="h-4 w-4 mr-2" />
            Start Import
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
            <DialogDescription>
              You are about to import data from <strong>{fileName}</strong> with the following settings:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>
                <strong>Rows to process:</strong> {preview.length}+ rows
              </li>
              <li>
                <strong>Duplicate handling:</strong>{" "}
                {duplicateHandling === "update" && "Update existing records"}
                {duplicateHandling === "skip" && "Skip duplicates"}
                {duplicateHandling === "overwrite" && "Overwrite existing records"}
              </li>
              {validationErrors.length > 0 && (
                <li className="text-destructive">
                  <strong>Warnings:</strong> {validationErrors.length} validation issues detected
                </li>
              )}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirmDialog(false);
                onStartImport(duplicateHandling);
              }}
            >
              Confirm Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
