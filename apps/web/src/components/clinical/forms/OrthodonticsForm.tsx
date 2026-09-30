import React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { FindingFormProps } from "@danta/web/types/clinical";
import { Label } from "@danta/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@danta/ui";
import { Textarea } from "@danta/ui";
import { Button } from "@danta/ui";

const orthoSchema = z.object({
  condition: z.string().min(1, "Ortho condition is required"),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
});

export function OrthodonticsForm({ tooth, surface, initialData, onSave, onCancel }: FindingFormProps) {
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
        <Label>Orthodontic Condition</Label>
        <Select
          value={form.useField({ name: "condition" }).state.value}
          onValueChange={(val) => form.useField({ name: "condition" }).setValue(val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="crowding">Crowding</SelectItem>
            <SelectItem value="spacing">Spacing / Diastema</SelectItem>
            <SelectItem value="malocclusion">Malocclusion</SelectItem>
            <SelectItem value="ectopic">Ectopic Eruption</SelectItem>
            <SelectItem value="impacted">Impacted Tooth</SelectItem>
            <SelectItem value="bracket_bonded">Bracket Bonded</SelectItem>
            <SelectItem value="aligner_active">Aligner Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Alignment Notes</Label>
        <Textarea
          placeholder="Rotation, tipping, or specific positional notes..."
          value={form.useField({ name: "diagnosis" }).state.value}
          onChange={(e) => form.useField({ name: "diagnosis" }).setValue(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Movement Plan</Label>
        <Textarea
          placeholder="Desired movement, force, or appliance adjustment..."
          value={form.useField({ name: "treatmentPlan" }).state.value}
          onChange={(e) => form.useField({ name: "treatmentPlan" }).setValue(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => form.handleSubmit()}>
          Save Ortho Finding
        </Button>
      </div>
    </div>
  );
}
