import React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { FindingFormProps } from "@danta/web/types/clinical";
import { Button } from "@danta/ui";
import { Input } from "@danta/ui";
import { Label } from "@danta/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@danta/ui";
import { Textarea } from "@danta/ui";

const diagnosisSchema = z.object({
  condition: z.string().min(1, "Condition is required"),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
});

export function DiagnosisForm({ tooth, surface, initialData, onSave, onCancel }: FindingFormProps) {
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
        <Label>Diagnosis Type</Label>
        <Select
          value={form.useField({ name: "condition" }).state.value}
          onValueChange={(val) => form.useField({ name: "condition" }).setValue(val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a diagnosis..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="caries">Dental Caries</SelectItem>
            <SelectItem value="fracture">Tooth Fracture</SelectItem>
            <SelectItem value="mobility">Increased Mobility</SelectItem>
            <SelectItem value="abscess">Periapical Abscess</SelectItem>
            <SelectItem value="attrition">Attrition</SelectItem>
            <SelectItem value="abrasion">Abrasion</SelectItem>
            <SelectItem value="erosion">Erosion</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Clinical Diagnosis Notes</Label>
        <Textarea
          placeholder="Enter detailed diagnosis..."
          value={form.useField({ name: "diagnosis" }).state.value}
          onChange={(e) => form.useField({ name: "diagnosis" }).setValue(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Proposed Treatment Plan</Label>
        <Textarea
          placeholder="Enter proposed treatment..."
          value={form.useField({ name: "treatmentPlan" }).state.value}
          onChange={(e) => form.useField({ name: "treatmentPlan" }).setValue(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => form.handleSubmit()}>
          Save Diagnosis
        </Button>
      </div>
    </div>
  );
}
