import React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { FindingFormProps } from "@danta/web/types/clinical";
import { Label } from "@danta/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@danta/ui";
import { Textarea } from "@danta/ui";
import { Button } from "@danta/ui";

const endoSchema = z.object({
  condition: z.string().min(1, "Endo condition is required"),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
});

export function EndodonticsForm({ tooth, surface, initialData, onSave, onCancel }: FindingFormProps) {
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
        <Label>Endodontic Status</Label>
        <Select
          value={form.useField({ name: "condition" }).state.value}
          onValueChange={(val) => form.useField({ name: "condition" }).setValue(val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pulpitis_reversible">Reversible Pulpitis</SelectItem>
            <SelectItem value="pulpitis_irreversible">Irreversible Pulpitis</SelectItem>
            <SelectItem value="pulp_necrosis">Pulp Necrosis</SelectItem>
            <SelectItem value="apical_periodontitis">Apical Periodontitis</SelectItem>
            <SelectItem value="periapical_abscess">Periapical Abscess</SelectItem>
            <SelectItem value="rct_completed">RCT Completed</SelectItem>
            <SelectItem value="rct_in_progress">RCT In Progress</SelectItem>
            <SelectItem value="internal_resorption">Internal Resorption</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Diagnostic Findings</Label>
        <Textarea
          placeholder="Cold test response, percussion, percussion, radiographic findings..."
          value={form.useField({ name: "diagnosis" }).state.value}
          onChange={(e) => form.useField({ name: "diagnosis" }).setValue(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Endo Treatment Plan</Label>
        <Textarea
          placeholder="Number of visits, medication, apical plug, etc..."
          value={form.useField({ name: "treatmentPlan" }).state.value}
          onChange={(e) => form.useField({ name: "treatmentPlan" }).setValue(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => form.handleSubmit()}>
          Save Endo Finding
        </Button>
      </div>
    </div>
  );
}
