import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { formatDuration } from "@/lib/gym-store";

type Props = {
  seconds: number;
  onClose: () => void;
  onChangeDefault: (s: number) => void;
};

export function RestTimer({ seconds, onClose, onChangeDefault }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    setRemaining(seconds);
    setRunning(true);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining === 0) setRunning(false);
  }, [remaining]);

  const pct = seconds > 0 ? ((seconds - remaining) / seconds) * 100 : 100;

  return (
    <div className="fixed inset-x-0 bottom-[60px] z-50 mx-auto max-w-md px-3 pb-2">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-accent transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {remaining === 0 ? "Rest complete" : "Resting"}
            </p>
            <p className="font-display text-3xl leading-none text-foreground">
              {formatDuration(remaining * 1000)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {[60, 90, 120, 180].map((s) => (
              <button
                key={s}
                onClick={() => onChangeDefault(s)}
                className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                  s === seconds
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}s
              </button>
            ))}
            <button
              onClick={() => setRunning((r) => !r)}
              aria-label={running ? "Pause rest timer" : "Resume rest timer"}
              className="rounded-lg bg-muted p-2 text-foreground"
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setRemaining(seconds)}
              aria-label="Restart rest timer"
              className="rounded-lg bg-muted p-2 text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Dismiss rest timer"
              className="rounded-lg bg-muted p-2 text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
