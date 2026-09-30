import { ToothCondition } from "@danta/schemas";

export interface FindingFormProps {
  tooth: string;
  surface: string | null;
  initialData?: Partial<ToothCondition>;
  onSave: (data: Partial<ToothCondition>) => Promise<void>;
  onCancel: () => void;
}

export interface FindingForm {
  moduleType: string;
  component: React.ComponentType<FindingFormProps>;
  description: string;
}

export type ClinicalModuleForms = Record<string, FindingForm>;
