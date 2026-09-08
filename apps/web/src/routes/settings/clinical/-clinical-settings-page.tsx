import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Plus, Loader2, Settings2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@danta/ui/card';
import { Button } from '@danta/ui/button';
import { Badge } from '@danta/ui/badge';
import { Switch } from '@danta/ui/switch';
import { Skeleton } from '@danta/ui/skeleton';
import { EmptyState } from '@danta/ui/feedback-states';
import {
  getClinicalModules,
  getTenantSchedulingResources,
  addModuleToResource,
  updateResourceModule,
  removeModuleFromResource,
} from '../../../lib/api/clinical-modules';
import { DEFAULT_ODONTOGRAM_RESOURCE } from '@danta/schemas';
import type { ClinicalModule, SchedulingResourceModule } from '@danta/schemas';

type ResourceWithModules = {
  id: string;
  tenantId: string;
  type: string;
  name: string;
  description: string | null;
  active: boolean;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  modules: (SchedulingResourceModule & { clinicalModule: ClinicalModule })[];
};

export function ClinicalSettingsPage() {
  const queryClient = useQueryClient();
  const [addingModuleId, setAddingModuleId] = useState<string | null>(null);

  const systemModulesQuery = useQuery({
    queryKey: ['clinical-modules', 'system'],
    queryFn: getClinicalModules,
  });

  const resourcesQuery = useQuery({
    queryKey: ['scheduling-resources'],
    queryFn: getTenantSchedulingResources,
  });

  const resource = (resourcesQuery.data?.[0] ?? null) as ResourceWithModules | null;
  const systemModules = systemModulesQuery.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['scheduling-resources'] });

  const addMutation = useMutation({
    mutationFn: ({ resourceId, moduleId }: { resourceId: string; moduleId: string }) =>
      addModuleToResource(resourceId, moduleId, { active: true, order: 99 }),
    onSuccess: () => {
      toast.success('Module added to resource');
      invalidate();
    },
    onError: () => toast.error('Failed to add module'),
    onSettled: () => setAddingModuleId(null),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ resourceId, moduleId, active }: { resourceId: string; moduleId: string; active: boolean }) =>
      updateResourceModule(resourceId, moduleId, { active }),
    onSuccess: () => invalidate(),
    onError: () => toast.error('Failed to update module'),
  });

  const removeMutation = useMutation({
    mutationFn: ({ resourceId, moduleId }: { resourceId: string; moduleId: string }) =>
      removeModuleFromResource(resourceId, moduleId),
    onSuccess: () => {
      toast.success('Module removed from resource');
      invalidate();
    },
    onError: () => toast.error('Failed to remove module'),
  });

  const isLoading = systemModulesQuery.isLoading || resourcesQuery.isLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clinical resources</CardTitle>
          <CardDescription>Configurable clinical modules for the odontogram.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (systemModulesQuery.isError || resourcesQuery.isError) {
    return (
      <Card>
        <CardContent className="py-6">
          <EmptyState
            title="Could not load clinical settings"
            description="Check your connection and try again."
          />
        </CardContent>
      </Card>
    );
  }

  const associated = new Map((resource?.modules ?? []).map((m) => [m.clinicalModuleId, m]));
  const available = systemModules.filter((m) => !associated.has(m.id));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" /> {resource?.name ?? DEFAULT_ODONTOGRAM_RESOURCE.name}
          </CardTitle>
          <CardDescription>
            {resource?.description ?? DEFAULT_ODONTOGRAM_RESOURCE.description} Toggle which clinical disciplines appear when charting a tooth.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!resource && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No clinical resource configured yet. Modules below are available system-wide.
            </p>
          )}
          <ul className="divide-y rounded-lg border">
            {systemModules.map((module) => {
              const link = associated.get(module.id);
              const isActive = link?.active ?? false;
              return (
                <li key={module.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{module.displayName}</span>
                      <Badge variant="secondary" className="text-[10px]">{module.type}</Badge>
                      {link && (
                        <Badge variant={isActive ? 'default' : 'outline'} className="text-[10px]">
                          {isActive ? 'Enabled' : 'Disabled'}
                        </Badge>
                      )}
                    </div>
                    {module.description && (
                      <p className="truncate text-xs text-muted-foreground">{module.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {link ? (
                      <>
                        <Switch
                          checked={isActive}
                          disabled={toggleMutation.isPending}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ resourceId: resource!.id, moduleId: module.id, active: checked })
                          }
                          aria-label={`Toggle ${module.displayName}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={removeMutation.isPending}
                          onClick={() => removeMutation.mutate({ resourceId: resource!.id, moduleId: module.id })}
                        >
                          Remove
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!resource || addMutation.isPending || addingModuleId === module.id}
                        onClick={() => {
                          if (!resource) return;
                          setAddingModuleId(module.id);
                          addMutation.mutate({ resourceId: resource.id, moduleId: module.id });
                        }}
                      >
                        {addingModuleId === module.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Add
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {available.length === 0 && resource && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5" /> All system modules are attached to this resource.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ClinicalSettingsPage;
