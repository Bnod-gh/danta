import React, { createContext, useContext, useReducer, useMemo, type ReactNode } from "react";
import type { OdontogramSelection } from "../../components/clinical/Odontogram";
import type { Dentition } from "@danta/schemas";

interface ChartSessionState {
  selection: OdontogramSelection | null;
  /** Teeth selected for batch operations (future multi-select). */
  selectedTeeth: string[];
  dentition: Dentition;
  undoStack: string[];
  redoStack: string[];
}

export interface UndoEntry {
  label: string;
  undo: () => Promise<void> | void;
}

type ChartAction =
  | { type: "SET_SELECTION"; selection: OdontogramSelection | null }
  | { type: "TOGGLE_TOOTH"; tooth: string }
  | { type: "CLEAR_TEETH" }
  | { type: "SET_DENTITION"; dentition: Dentition }
  | { type: "PUSH_UNDO"; entry: UndoEntry }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR_HISTORY" }
  | { type: "RESET" };

const initialState: ChartSessionState = {
  selection: null,
  selectedTeeth: [],
  dentition: "permanent",
  undoStack: [],
  redoStack: [],
};

function reducer(state: ChartSessionState, action: ChartAction): ChartSessionState {
  switch (action.type) {
    case "SET_SELECTION":
      return { ...state, selection: action.selection };
    case "TOGGLE_TOOTH": {
      const exists = state.selectedTeeth.includes(action.tooth);
      return { ...state, selectedTeeth: exists ? state.selectedTeeth.filter((t) => t !== action.tooth) : [...state.selectedTeeth, action.tooth] };
    }
    case "CLEAR_TEETH":
      return { ...state, selectedTeeth: [] };
    case "SET_DENTITION":
      return { ...state, dentition: action.dentition, selectedTeeth: [], selection: null };
    case "PUSH_UNDO":
      return { ...state, undoStack: [...state.undoStack, action.entry.label], redoStack: [] };
    case "UNDO":
      return { ...state, undoStack: state.undoStack.slice(0, -1), redoStack: [...state.redoStack, state.undoStack[state.undoStack.length - 1] || ""] };
    case "REDO":
      return { ...state, redoStack: state.redoStack.slice(0, -1), undoStack: [...state.undoStack, state.redoStack[state.redoStack.length - 1] || ""] };
    case "CLEAR_HISTORY":
      return { ...state, undoStack: [], redoStack: [] };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface ChartSessionCtxValue extends ChartSessionState {
  setSelection: (selection: OdontogramSelection | null) => void;
  toggleTooth: (tooth: string) => void;
  clearTeeth: () => void;
  setDentition: (dentition: Dentition) => void;
  pushUndo: (entry: UndoEntry) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  reset: () => void;
}

const ChartSessionContext = createContext<ChartSessionCtxValue | null>(null);

export function ChartSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const undoEntries = React.useRef<UndoEntry[]>([]);

  const value = useMemo<ChartSessionCtxValue>(
    () => ({
      ...state,
      setSelection: (selection) => dispatch({ type: "SET_SELECTION", selection }),
      toggleTooth: (tooth) => dispatch({ type: "TOGGLE_TOOTH", tooth }),
      clearTeeth: () => dispatch({ type: "CLEAR_TEETH" }),
      setDentition: (dentition) => dispatch({ type: "SET_DENTITION", dentition }),
      pushUndo: (entry) => { undoEntries.current.push(entry); dispatch({ type: "PUSH_UNDO", entry }); },
      undo: () => {
        const last = undoEntries.current.pop();
        if (last) { last.undo(); dispatch({ type: "UNDO" }); }
      },
      redo: () => dispatch({ type: "REDO" }),
      clearHistory: () => { undoEntries.current = []; dispatch({ type: "CLEAR_HISTORY" }); },
      reset: () => dispatch({ type: "RESET" }),
    }),
    [state],
  );
  return <ChartSessionContext.Provider value={value}>{children}</ChartSessionContext.Provider>;
}

export function useChartSession(): ChartSessionCtxValue {
  const ctx = useContext(ChartSessionContext);
  if (!ctx) throw new Error("useChartSession must be used within ChartSessionProvider");
  return ctx;
}