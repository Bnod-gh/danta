import React, { createContext, useContext, useState } from 'react';
import type { ClinicalModule } from '@danta/schemas';

interface ClinicalModuleContextType {
  // Active module for current workflow
  activeModule: ClinicalModule | null;
  setActiveModule: (module: ClinicalModule | null) => void;

  // Current tooth being edited
  selectedTooth: string | null;
  setSelectedTooth: (tooth: string | null) => void;

  // Whether to show module selector on tooth click
  showModuleSelector: boolean;
  setShowModuleSelector: (show: boolean) => void;
}

const ClinicalModuleContext = createContext<ClinicalModuleContextType | undefined>(undefined);

export function ClinicalModuleProvider({ children }: { children: React.ReactNode }) {
  const [activeModule, setActiveModule] = useState<ClinicalModule | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [showModuleSelector, setShowModuleSelector] = useState(false);

  return (
    <ClinicalModuleContext.Provider
      value={{
        activeModule,
        setActiveModule,
        selectedTooth,
        setSelectedTooth,
        showModuleSelector,
        setShowModuleSelector,
      }}
    >
      {children}
    </ClinicalModuleContext.Provider>
  );
}

/**
 * Hook to access clinical module context
 * Throws error if used outside ClinicalModuleProvider
 */
export function useClinicalModule() {
  const context = useContext(ClinicalModuleContext);
  if (!context) {
    throw new Error('useClinicalModule must be used within ClinicalModuleProvider');
  }
  return context;
}
