import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@danta/ui/tabs";
import { Button } from "@danta/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@danta/ui/card";
import { Skeleton } from "@danta/ui/skeleton";
import { cn } from "@danta/ui/utils";
import { getProcedureCatalog, type PaletteTreatment } from "../../lib/api/dental-charts";
import { useChartSession } from "../../lib/clinical/chart-session";
import { CONDITION_COLORS, CONDITION_LABELS, type DentalCondition, type ToothSurface } from "@danta/schemas";

const CATEGORY_HINTS: Record<string, DentalCondition> = {
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

function inferSurfaces(treatment: PaletteTreatment): ToothSurface[] {
  if (treatment.chartDefaultSurfaces?.length) return treatment.chartDefaultSurfaces as ToothSurface[];
  return ["occlusal"];
}

export function TreatmentPalette() {
  const { activeTreatment, setActiveTreatment, mode } = useChartSession();
  const [category, setCategory] = useState<string>("all");

  const catalogQuery = useQuery<PaletteTreatment[]>({
    queryKey: ["procedure-catalog", category],
    queryFn: () => getProcedureCatalog(category === "all" ? undefined : category),
  });

  const treatments = catalogQuery.data ?? [];
  const categories = Array.from(new Set(treatments.map((t) => t.category).filter((c): c is string => Boolean(c))));
  const activeId = activeTreatment?.procedureCodeId ?? null;

  const handlePick = (t: PaletteTreatment) => {
    const condition = (t.chartTargetCondition as DentalCondition) ?? CATEGORY_HINTS[t.category] ?? "caries";
    if (activeId === t.id) {
      setActiveTreatment(null);
    } else {
      setActiveTreatment({
        condition,
        surfaces: inferSurfaces(t),
        scope: "tooth",
        procedureCodeId: t.id,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: mode === "apply" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
            Treatment palette
          </span>
          {activeTreatment && (
            <Button variant="ghost" size="sm" onClick={() => setActiveTreatment(null)}>
              Clear
            </Button>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {activeTreatment
            ? <>Active: <span className="font-medium text-foreground">{CONDITION_LABELS[activeTreatment.condition]}</span> — click teeth to apply</>
            : "Select a treatment, then click teeth or surfaces to apply it."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {catalogQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : treatments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No treatments in the catalogue. Add procedure codes with chart-target mappings to populate the palette.
          </p>
        ) : (
          <>
            {categories.length > 1 && (
              <Tabs value={category} onValueChange={setCategory}>
                <TabsList className="flex-wrap h-auto gap-1">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  {categories.map((c) => (
                    <TabsTrigger key={c} value={c} className="text-xs">{c}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {treatments.map((t) => {
                const isActive = activeId === t.id;
                const condition = (t.chartTargetCondition as DentalCondition) ?? CATEGORY_HINTS[t.category] ?? "caries";
                return (
                  <Button
                    key={t.id}
                    variant={isActive ? "default" : "outline"}
                    className={cn(
                      "h-auto flex-col items-start gap-1 p-3 text-left normal-case",
                      isActive && "ring-2 ring-primary",
                    )}
                    onClick={() => handlePick(t)}
                    aria-pressed={isActive}
                  >
                    <span className="flex w-full items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-muted-foreground">{t.code}</span>
                      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CONDITION_COLORS[condition as DentalCondition] ?? "transparent" }} />
                    </span>
                    <span className="text-xs font-medium leading-tight line-clamp-2">{t.description}</span>
                    <span className="text-[10px] text-muted-foreground">${t.defaultFee.toFixed(0)}</span>
                  </Button>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
