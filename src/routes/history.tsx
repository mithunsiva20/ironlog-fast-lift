import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { useGym } from "@/hooks/use-gym";
import {
  formatDate,
  formatDuration,
  workoutSetCount,
  workoutVolume,
} from "@/lib/gym-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Workout History — IronLog" },
      {
        name: "description",
        content:
          "Review every logged lifting session: exercises, sets, reps, weight, duration and total volume.",
      },
      { property: "og:title", content: "Workout History — IronLog" },
      {
        property: "og:description",
        content: "Every logged lifting session with sets, reps, weight and total volume.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { ready, history } = useGym();

  return (
    <main className="mx-auto min-h-screen max-w-md bg-background pb-28">
      <h1 className="px-4 pt-6 font-display text-4xl tracking-wide text-foreground">History</h1>

      {ready && history.length === 0 ? (
        <p className="px-4 pt-8 text-sm text-muted-foreground">
          No sessions yet. Finish a workout and it will show up here.
        </p>
      ) : null}

      <ul className="space-y-3 px-3 pt-4">
        {history.map((w) => (
          <li key={w.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
              <h2 className="truncate font-display text-2xl text-foreground">
                {formatDate(w.startedAt)}
              </h2>
              <span className="shrink-0 text-xs uppercase tracking-widest text-muted-foreground">
                {formatDuration((w.finishedAt ?? w.startedAt) - w.startedAt)}
              </span>
            </div>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              {workoutSetCount(w)} sets · {Math.round(workoutVolume(w)).toLocaleString()} kg
            </p>
            <ul className="mt-3 space-y-2">
              {w.exercises.map((e) => (
                <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
                  <span className="truncate text-foreground">{e.name}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {e.sets.map((s) => `${s.weight}×${s.reps}`).join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <BottomNav />
    </main>
  );
}
