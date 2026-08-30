import { } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Badge } from "@danta/ui/badge";
import { CONDITION_COLORS, CONDITION_LABELS, type DentalCondition } from "@danta/schemas";
import { deleteToothCondition } from "../../lib/api/dental-charts";

interface HistoryChipsProps {
  chartId: string | null;
  patientId: string;
}

interface Chip {
  id: string;
  kind: "finding" | "mouth";
  label: string;
  condition?: DentalCondition;
  detail: string;
}

/** Whole-mouth + recent-finding chips shown above the palette. Dismiss = soft-remove. */
export function HistoryChips({ chartId, patientId }: HistoryChipsProps) {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["odontogram-history", patientId, chartId],
    queryFn: async (): Promise<Chip[]> => {
      if (!chartId) return [];
      const conditions = queryClient.getQueryData<Array<{ id: string; condition: string; toothNumber: string | null; scope: string; surfaces: string[]; status: string; notes: string | null }>>(["tooth-conditions", chartId]) ?? [];
      const chips: Chip[] = [];
      for (const c of conditions) {
        if (c.scope === "mouth") {
          chips.unshift({ id: c.id, kind: "mouth", label: c.notes || CONDITION_LABELS[c.condition as DentalCondition] || c.condition, condition: c.condition as DentalCondition, detail: "Whole mouth" });
        } else if (c.toothNumber) {
          chips.push({ id: c.id, kind: "finding", label: CONDITION_LABELS[c.condition as DentalCondition] || c.condition, condition: c.condition as DentalCondition, detail: `Tooth ${c.toothNumber}${c.surfaces?.length ? ` · ${c.surfaces.join("+")}` : ""}` });
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
              {chip.condition && <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: CONDITION_COLORS[chip.condition] }} />}
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
