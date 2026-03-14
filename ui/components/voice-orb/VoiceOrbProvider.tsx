import { createContext, useContext } from "react";
import { useVoiceOrb } from "./useVoiceOrb";

const VoiceOrbContext = createContext(null);

/**
 * VoiceOrbProvider — Wraps your app and shares one orb state/audio pipeline
 * across all consumers via useVoiceOrbContext().
 */
export function VoiceOrbProvider({ children, options = {} }) {
  const orb = useVoiceOrb(options);
  return (
    <VoiceOrbContext.Provider value={orb}>
      {children}
    </VoiceOrbContext.Provider>
  );
}

export function useVoiceOrbContext() {
  const ctx = useContext(VoiceOrbContext);
  if (!ctx) throw new Error("useVoiceOrbContext must be used inside <VoiceOrbProvider>");
  return ctx;
}
