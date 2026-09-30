import React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { FindingFormProps } from "@danta/web/types/clinical";
import { Label } from "@danta/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@danta/ui";
import { Textarea } from "@danta/ui";
import { Button } from "@danta/ui";

const pediatricSchema = z.object({
  condition: z.string().min(1, "Pediatric condition is required"),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
});

export function PediatricForm({ tooth, surface, initialData, onSave, onCancel }: FindingFormProps) {
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
        <Label>Pediatric Condition</Label>
        <Select
          value={form.useField({ name: "condition" }).state.value}
          onValueChange={(val) => form.useField({ name: "condition" }).setValue(val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="early_childhood_caries">Early Childhood Caries</SelectItem>
            <SelectItem value="hypoplasia">Enamel Hypoplasia</SelectItem>
            <SelectItem value="supernumerary">Supernumerary Tooth</SelectItem>
            <SelectItem value="space_maintainer">Space Maintainer Required</SelectItem>
            <SelectItem value="pulpotomy">Pulpotomy</SelectItem>
            <SelectItem value="pulpectomy">Pulpectomy</SelectItem>
            <SelectItem value="primary_extraction">Primary Tooth Extraction</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Clinical Notes</Label>
        <Textarea
          placeholder="Patient behavior, cooperation, or specific developmental notes..."
          value={form.useField({ name: "diagnosis" }).state.value}
          onChange={(e) => form.useField({ name: "diagnosis" }).setValue(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Pediatric Treatment Plan</Label>
        <Textarea
          placeholder="Guidance, sedation, or developmental monitoring..."
          value={form.useField({ name: "treatmentPlan" }).state.value}
          onChange={(e) => form.useField({ name: "treatmentPlan" }).setValue(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => form.handleSubmit()}>
          Save Pediatric Finding
        </Button>
      </div>
    </div>
  );
}
