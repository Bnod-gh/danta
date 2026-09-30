import React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { FindingFormProps } from "@danta/web/types/clinical";
import { Label } from "@danta/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@danta/ui";
import { Textarea } from "@danta/ui";
import { Button } from "@danta/ui";

const preventiveSchema = z.object({
  condition: z.string().min(1, "Preventive service is required"),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
});

export function PreventiveForm({ tooth, surface, initialData, onSave, onCancel }: FindingFormProps) {
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
        <Label>Preventive Service</Label>
        <Select
          value={form.useField({ name: "condition" }).state.value}
          onValueChange={(val) => form.useField({ name: "condition" }).setValue(val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select service..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sealant">Sealant Application</SelectItem>
            <SelectItem value="fluoride">Fluoride Treatment</SelectItem>
            <SelectItem value="prophylaxis">Professional Cleaning</SelectItem>
            <SelectItem value="scaling">Scaling (Basic)</SelectItem>
            <SelectItem value="education">Oral Hygiene Education</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Assessment</Label>
        <Textarea
          placeholder="Plaque levels, staining, or specific areas of concern..."
          value={form.useField({ name: "diagnosis" }).state.value}
          onChange={(e) => form.useField({ name: "diagnosis" }).setValue(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Prevention Plan</Label>
        <Textarea
          placeholder="Recall interval, specific home-care advice..."
          value={form.useField({ name: "treatmentPlan" }).state.value}
          onChange={(e) => form.useField({ name: "treatmentPlan" }).setValue(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => form.handleSubmit()}>
          Save Preventive Finding
        </Button>
      </div>
    </div>
  );
}
