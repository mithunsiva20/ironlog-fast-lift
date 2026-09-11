import { useCallback, useEffect, useState } from "react";
import {
  loadActive,
  loadHistory,
  saveActive,
  saveHistory,
  type Workout,
} from "@/lib/gym-store";

export function useGym() {
  const [ready, setReady] = useState(false);
  const [history, setHistory] = useState<Workout[]>([]);
  const [active, setActive] = useState<Workout | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
    setActive(loadActive());
    setReady(true);
  }, []);

  const updateActive = useCallback((next: Workout | null) => {
    setActive(next);
    saveActive(next);
  }, []);

  const updateHistory = useCallback((next: Workout[]) => {
    setHistory(next);
    saveHistory(next);
  }, []);

  return { ready, history, active, updateActive, updateHistory };
}
