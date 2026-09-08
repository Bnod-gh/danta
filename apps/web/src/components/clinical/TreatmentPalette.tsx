import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Select } from "@danta/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@danta/ui/card";
import { Skeleton } from "@danta/ui/skeleton";
import { getProcedureCatalog, type PaletteTreatment } from "../../lib/api/dental-charts";
import { getToothConditionConfigs } from "../../lib/api/tooth-condition-configs";
import type { ToothConditionConfig } from "@danta/schemas";

const CATEGORY_HINTS: Record<string, string> = {
  Diagnostic: "caries",
  Diagnosis: "caries",
  Restorative: "filling",
  Surgery: "extraction",
  Endodontics: "root_canal",
  Orthodontics: "crown",
  Preventive: "filling",
  Periodontics: "extraction",
  Pediatric: "filling",
};

export function TreatmentPalette() {
  const [category, setCategory] = useState<string>("all");
  const { data: conditionConfigsList = [] } = useQuery<ToothConditionConfig[]>({
    queryKey: ["tooth-condition-configs"],
    queryFn: () => getToothConditionConfigs(),
  });

  const conditionConfigMap = useMemo(() => {
    return conditionConfigsList.reduce((acc, cfg) => {
      acc[cfg.code] = cfg;
      return acc;
    }, {} as Record<string, ToothConditionConfig>);
  }, [conditionConfigsList]);

  const catalogQuery = useQuery<PaletteTreatment[]>({
    queryKey: ["procedure-catalog", category],
    queryFn: () => getProcedureCatalog(category === "all" ? undefined : category),
  });

  const treatments = catalogQuery.data ?? [];
  const categories = Array.from(new Set(treatments.map(t => t.category).filter((c): c is string => Boolean(c))));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Clinical catalogue</CardTitle>
        <p className="text-sm text-muted-foreground">
          Browse available findings and treatments. Click a tooth to open the charting panel.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {catalogQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : treatments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No catalogue items. Add procedure codes with chart-target mappings to populate the palette.
          </p>
        ) : (
          <>
            {categories.length > 0 && (
              <Select value={category} onChange={(e) => setCategory(e.target.value)} className="mb-4 w-full max-w-xs">
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            )}
            <Select className="w-full">
              <option value="">Select a treatment...</option>
              {treatments.map(t => {
                const condition = (t.chartTargetCondition as string) ?? CATEGORY_HINTS[t.category] ?? "caries";
                const config = conditionConfigMap[condition];
                const label = `[${config?.name ?? condition}] ${t.code} - ${t.description} ($${Number(t.defaultFee).toFixed(0)})`;
                return (
                  <option key={t.id} value={t.id}>
                    {label}
                  </option>
                );
              })}
            </Select>
          </>
        )}
      </CardContent>
    </Card>
  );
}
