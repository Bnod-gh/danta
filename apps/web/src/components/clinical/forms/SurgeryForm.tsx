import React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { FindingFormProps } from "@danta/web/types/clinical";
import { Label } from "@danta/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@danta/ui";
import { Textarea } from "@danta/ui";
import { Button } from "@danta/ui";

const surgerySchema = z.object({
  condition: z.string().min(1, "Procedure type is required"),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
});

export function SurgeryForm({ tooth, surface, initialData, onSave, onCancel }: FindingFormProps) {
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
        <Label>Surgical Procedure</Label>
        <Select
          value={form.useField({ name: "condition" }).state.value}
          onValueChange={(val) => form.useField({ name: "condition" }).setValue(val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a procedure..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="extraction">Simple Extraction</SelectItem>
            <SelectItem value="surgical_extraction">Surgical Extraction</SelectItem>
            <SelectItem value="apicoectomy">Apicoectomy</SelectItem>
            <SelectItem value="implant_placement">Implant Placement</SelectItem>
            <SelectItem value="bone_graft">Bone Grafting</SelectItem>
            <SelectItem value="frenectomy">Frenectomy</SelectItem>
            <SelectItem value="biopsy">Tissue Biopsy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Clinical Indications</Label>
        <Textarea
          placeholder="Reason for surgery, complications, or pre-op notes..."
          value={form.useField({ name: "diagnosis" }).state.value}
          onChange={(e) => form.useField({ name: "diagnosis" }).setValue(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Post-Op Plan</Label>
        <Textarea
          placeholder="Healing monitoring, suturing, or follow-up..."
          value={form.useField({ name: "treatmentPlan" }).state.value}
          onChange={(e) => form.useField({ name: "treatmentPlan" }).setValue(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => form.handleSubmit()}>
          Save Surgical Finding
        </Button>
      </div>
    </div>
  );
}
