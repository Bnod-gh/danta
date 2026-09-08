import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { X } from "lucide-react";
import { Badge } from "@danta/ui/badge";
import { deleteToothCondition } from "../../lib/api/dental-charts";
import type { ToothConditionConfig } from "@danta/schemas";

interface HistoryChipsProps {
  chartId: string | null;
  patientId: string;
  conditionConfigs: ToothConditionConfig[];
}

interface Chip {
  id: string;
  kind: "finding" | "mouth";
  label: string;
  condition?: string;
  detail: string;
}

/** Whole-mouth + recent-finding chips shown above the palette. Dismiss = soft-remove. */
export function HistoryChips({ chartId, patientId, conditionConfigs }: HistoryChipsProps) {
  const queryClient = useQueryClient();

  const conditionConfigMap = useMemo(() => {
    return conditionConfigs.reduce((acc, cfg) => {
      acc[cfg.code] = cfg;
      return acc;
    }, {} as Record<string, ToothConditionConfig>);
  }, [conditionConfigs]);

  const historyQuery = useQuery({
    queryKey: ["odontogram-history", patientId, chartId],
    queryFn: async (): Promise<Chip[]> => {
      if (!chartId) return [];
      const conditions = queryClient.getQueryData<Array<{ id: string; condition: string; toothNumber: string | null; scope: string; surfaces: string[]; status: string; notes: string | null }>>(["tooth-conditions", chartId]) ?? [];
      const chips: Chip[] = [];
      for (const c of conditions) {
        const cfg = conditionConfigMap[c.condition];
        const label = cfg?.name ?? c.condition;
        if (c.scope === "mouth") {
          chips.unshift({ id: c.id, kind: "mouth", label: c.notes || label, condition: c.condition, detail: "Whole mouth" });
        } else if (c.toothNumber) {
          chips.push({ id: c.id, kind: "finding", label, condition: c.condition, detail: `Tooth ${c.toothNumber}${c.surfaces?.length ? ` · ${c.surfaces.join("+")}` : ""}` });
        }
      }
      return chips.slice(0, 12);
    },
    enabled: Boolean(chartId),
  });

  const dismiss = async (id: string) => {
    if (!chartId) return;
    await deleteToothCondition(id);
    await queryClient.invalidateQueries({ queryKey: ["tooth-conditions", chartId] });
    await queryClient.invalidateQueries({ queryKey: ["odontogram-history", patientId, chartId] });
  };

  const chips = historyQuery.data ?? [];

  if (!chartId || chips.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Whole mouth · recent</p>
      <div className="flex overflow-x-auto pb-1">
        <div className="flex gap-1.5">
          {chips.map((chip) => (
            <Badge key={chip.id} variant="secondary" className="flex items-center gap-1.5 whitespace-nowrap pr-1">
              {chip.condition && <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: conditionConfigMap[chip.condition]?.color ?? '#64748b' }} />}
              <span className="text-xs font-medium">{chip.label}</span>
              <span className="text-[10px] text-muted-foreground">{chip.detail}</span>
              <button
                type="button"
                onClick={() => dismiss(chip.id)}
                aria-label={`Remove ${chip.label}`}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
