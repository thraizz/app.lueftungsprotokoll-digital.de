import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type FormStep = "initial" | "timer" | "after-measurements";

interface VentilationSessionData {
  apartmentId: string;
  date: string;
  time: string;
  rooms: string[];
  ventilationType: string;
  duration: string;
  tempBefore: string;
  humidityBefore: string;
  tempAfter?: string;
  humidityAfter?: string;
  notes?: string;
}

interface VentilationSessionState {
  step: FormStep;
  targetEndTime: number | null;
  formData: VentilationSessionData | null;
}

interface VentilationSessionContextType {
  session: VentilationSessionState;
  startSession: (formData: VentilationSessionData, endTime: number) => void;
  updateSession: (updates: Partial<VentilationSessionState>) => void;
  clearSession: () => void;
  getRemainingSeconds: () => number;
}

const STORAGE_KEY = "ventilation-session";

const VentilationSessionContext = createContext<VentilationSessionContextType | undefined>(undefined);

const getInitialState = (): VentilationSessionState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as VentilationSessionState;
      // Validate that the session hasn't expired
      if (parsed.targetEndTime && Date.now() < parsed.targetEndTime) {
        return parsed;
      }
      // Session has expired, move to after-measurements
      if (parsed.targetEndTime && Date.now() >= parsed.targetEndTime) {
        return {
          ...parsed,
          step: "after-measurements",
          targetEndTime: null,
        };
      }
    }
  } catch (error) {
    console.error("Failed to load ventilation session from localStorage:", error);
  }

  return {
    step: "initial",
    targetEndTime: null,
    formData: null,
  };
};

export const VentilationSessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<VentilationSessionState>(getInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error("Failed to save ventilation session to localStorage:", error);
    }
  }, [session]);

  const startSession = (formData: VentilationSessionData, endTime: number) => {
    setSession({
      step: "timer",
      targetEndTime: endTime,
      formData,
    });
  };

  const updateSession = (updates: Partial<VentilationSessionState>) => {
    setSession((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const clearSession = () => {
    setSession({
      step: "initial",
      targetEndTime: null,
      formData: null,
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const getRemainingSeconds = (): number => {
    if (session.targetEndTime === null) return 0;
    const remaining = Math.max(0, session.targetEndTime - Date.now());
    return Math.ceil(remaining / 1000);
  };

  return (
    <VentilationSessionContext.Provider
      value={{
        session,
        startSession,
        updateSession,
        clearSession,
        getRemainingSeconds,
      }}
    >
      {children}
    </VentilationSessionContext.Provider>
  );
};

export const useVentilationSession = () => {
  const context = useContext(VentilationSessionContext);
  if (context === undefined) {
    throw new Error("useVentilationSession must be used within a VentilationSessionProvider");
  }
  return context;
};
