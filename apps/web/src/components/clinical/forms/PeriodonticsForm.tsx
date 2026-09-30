import React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { FindingFormProps } from "@danta/web/types/clinical";
import { Label } from "@danta/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@danta/ui";
import { Textarea } from "@danta/ui";
import { Button } from "@danta/ui";

const perioSchema = z.object({
  condition: z.string().min(1, "Perio condition is required"),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
});

export function PeriodonticsForm({ tooth, surface, initialData, onSave, onCancel }: FindingFormProps) {
  const form = useForm({
    defaultValues: {
      condition: initialData?.condition || "",
      diagnosis: initialData?.diagnosis || "",
      treatmentPlan: initialData?.treatmentPlan || "",
    },
    onSubmit: async ({ value }) => {
      await onSave({
        ...value,
        toothNumber: tooth,
        surface: surface,
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Periodontal Status</Label>
        <Select
          value={form.useField({ name: "condition" }).state.value}
          onValueChange={(val) => form.useField({ name: "condition" }).setValue(val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gingivitis">Gingivitis</SelectItem>
            <SelectItem value="periodontitis_mild">Periodontitis (Mild)</SelectItem>
            <SelectItem value="periodontitis_mod">Periodontitis (Moderate)</SelectItem>
            <SelectItem value="periodontitis_sev">Periodontitis (Severe)</SelectItem>
            <SelectItem value="recession">Gingival Recession</SelectItem>
            <SelectItem value="pocketing">Deep Pocketing</SelectItem>
            <SelectItem value="furcation">Furcation Involvement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Clinical Findings</Label>
        <Textarea
          placeholder="BOP, plaque index, mobility, or systemic links..."
          value={form.useField({ name: "diagnosis" }).state.value}
          onChange={(e) => form.useField({ name: "diagnosis" }).setValue(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Perio Treatment Plan</Label>
        <Textarea
          placeholder="SRP, surgical flap, or maintenance frequency..."
          value={form.useField({ name: "treatmentPlan" }).state.value}
          onChange={(e) => form.useField({ name: "treatmentPlan" }).setValue(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => form.handleSubmit()}>
          Save Perio Finding
        </Button>
      </div>
    </div>
  );
}
