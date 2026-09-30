import React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { FindingFormProps } from "@danta/web/types/clinical";
import { Label } from "@danta/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@danta/ui";
import { Textarea } from "@danta/ui";
import { Button } from "@danta/ui";

const restorativeSchema = z.object({
  condition: z.string().min(1, "Restoration type is required"),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
});

export function RestorativeForm({ tooth, surface, initialData, onSave, onCancel }: FindingFormProps) {
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
        <Label>Restoration Type</Label>
        <Select
          value={form.useField({ name: "condition" }).state.value}
          onValueChange={(val) => form.useField({ name: "condition" }).setValue(val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select restoration..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="composite">Composite Filling</SelectItem>
            <SelectItem value="amalgam">Amalgam Filling</SelectItem>
            <SelectItem value="crown">Full Crown</SelectItem>
            <SelectItem value="onlay">Onlay</SelectItem>
            <SelectItem value="inlay">Inlay</SelectItem>
            <SelectItem value="veneer">Veneer</SelectItem>
            <SelectItem value="glass_ionomer">Glass Ionomer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Restoration Details</Label>
        <Textarea
          placeholder="Material, shade, or specific notes..."
          value={form.useField({ name: "diagnosis" }).state.value}
          onChange={(e) => form.useField({ name: "diagnosis" }).setValue(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Follow-up Plan</Label>
        <Textarea
          placeholder="Future checks or maintenance..."
          value={form.useField({ name: "treatmentPlan" }).state.value}
          onChange={(e) => form.useField({ name: "treatmentPlan" }).setValue(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => form.handleSubmit()}>
          Save Restoration
        </Button>
      </div>
    </div>
  );
}
