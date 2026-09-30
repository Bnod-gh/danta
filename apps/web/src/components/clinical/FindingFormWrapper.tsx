import React, { useState } from "react";
import { cn } from "@danta/ui/utils";
import { Button } from "@danta/ui";
import { Loader2, X } from "lucide-react";
import { FindingFormProps } from "@danta/web/types/clinical";

interface FindingFormWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

export function FindingFormWrapper({
  title,
  description,
  children,
  onSave,
  onCancel,
  initialData,
}: FindingFormWrapperProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (formData: any) => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(formData);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-background rounded-lg border shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {children}
        {error && (
          <div className="mt-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            {error}
          </div>
        )}
      </div>

      <div className="p-4 border-t flex justify-end gap-3 bg-muted/30">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={() => handleSave({})} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Finding
        </Button>
      </div>
    </div>
  );
}
