import { useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@danta/ui/dialog';
import { Button } from '@danta/ui/button';
import { Badge } from '@danta/ui/badge';
import type { ClinicalModule } from '@danta/schemas';

interface ModuleSelectorModalProps {
  open: boolean;
  tooth: string;
  modules: ClinicalModule[];
  onSelect: (module: ClinicalModule) => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * ModuleSelectorModal - Modal dialog for selecting a clinical module when clicking a tooth
 * Shows available clinical modules and allows the user to select which one to work with
 */
export function ModuleSelectorModal({
  open,
  tooth,
  modules,
  onSelect,
  onOpenChange,
}: ModuleSelectorModalProps) {
  // Sort modules by order
  const sortedModules = useMemo(() => {
    return [...modules].sort((a, b) => a.order - b.order);
  }, [modules]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Clinical Module</DialogTitle>
          <DialogDescription>
            Tooth {tooth} - choose a clinical discipline to continue
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-4">
          {sortedModules.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No clinical modules available. Configure modules in Settings → Clinical.
            </p>
          ) : (
            sortedModules.map((module) => (
              <Button
                key={module.id}
                variant="outline"
                className="h-auto justify-start gap-3 px-4 py-3 text-left"
                onClick={() => {
                  onSelect(module);
                  onOpenChange(false);
                }}
              >
                <div className="flex-1">
                  <div className="font-medium">{module.displayName}</div>
                  {module.description && (
                    <div className="text-xs text-muted-foreground">{module.description}</div>
                  )}
                </div>
                {module.type && <Badge variant="secondary" className="whitespace-nowrap text-xs">{module.type}</Badge>}
              </Button>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
