import React from "react";
import { FindingForm } from "@danta/web/types/clinical";
import { DiagnosisForm } from "./forms/DiagnosisForm";
import { RestorativeForm } from "./forms/RestorativeForm";
import { SurgeryForm } from "./forms/SurgeryForm";
import { EndodonticsForm } from "./forms/EndodonticsForm";
import { OrthodonticsForm } from "./forms/OrthodonticsForm";
import { PreventiveForm } from "./forms/PreventiveForm";
import { PeriodonticsForm } from "./forms/PeriodonticsForm";
import { PediatricForm } from "./forms/PediatricForm";

export const FINDING_FORM_REGISTRY: Record<string, FindingForm> = {
  diagnosis: {
    moduleType: "diagnosis",
    component: DiagnosisForm,
    description: "Record primary clinical diagnoses and findings.",
  },
  restorative: {
    moduleType: "restorative",
    component: RestorativeForm,
    description: "Record fillings, crowns, and other restorative work.",
  },
  surgery: {
    moduleType: "surgery",
    component: SurgeryForm,
    description: "Record extractions, implants, and surgical procedures.",
  },
  endodontics: {
    moduleType: "endodontics",
    component: EndodonticsForm,
    description: "Record root canal status and pulpal findings.",
  },
  orthodontics: {
    moduleType: "orthodontics",
    component: OrthodonticsForm,
    description: "Record alignment, braces, and orthodontic movements.",
  },
  preventive: {
    moduleType: "preventive",
    component: PreventiveForm,
    description: "Record sealants, fluoride, and hygiene services.",
  },
  periodontics: {
    moduleType: "periodontics",
    component: PeriodonticsForm,
    description: "Record periodontal status and scaling.",
  },
  pediatric: {
    moduleType: "pediatric",
    component: PediatricForm,
    description: "Record primary tooth findings and pediatric care.",
  },
};

export function getFindingForm(moduleType: string | null) {
  if (!moduleType) return null;
  // Handle potential prefixes like 'odontogram_'
  const type = moduleType.replace("odontogram_", "");
  return FINDING_FORM_REGISTRY[type] || null;
}
