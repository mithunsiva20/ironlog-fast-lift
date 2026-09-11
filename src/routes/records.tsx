import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useGym } from "@/hooks/use-gym";
import { computeRecords, formatDate } from "@/lib/gym-store";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Personal Records — IronLog" },
      {
        name: "description",
        content:
          "Track personal records per lift: heaviest set, best reps and estimated one-rep max from your logged training.",
      },
      { property: "og:title", content: "Personal Records — IronLog" },
      {
        property: "og:description",
        content: "Heaviest sets and estimated one-rep maxes for every lift you train.",
      },
    ],
  }),
  component: RecordsPage,
});

function RecordsPage() {
  const { ready, history } = useGym();
  const records = computeRecords(history);

  return (
    <main className="mx-auto min-h-screen max-w-md bg-background pb-28">
      <h1 className="px-4 pt-6 font-display text-4xl tracking-wide text-foreground">Records</h1>

      {ready && records.length === 0 ? (
        <p className="px-4 pt-8 text-sm text-muted-foreground">
          Complete a few sets and your bests will appear here automatically.
        </p>
      ) : null}

      <ul className="space-y-3 px-3 pt-4">
        {records.map((r) => (
          <li key={r.name} className="rounded-2xl border border-border bg-card p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-display text-2xl text-foreground">{r.name}</h2>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Last trained {formatDate(r.lastDate)}
                </p>
              </div>
              <Trophy className="h-5 w-5 shrink-0 text-chart-4" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Cell label="Top set" value={`${r.bestWeight}×${r.bestReps}`} />
              <Cell label="e1RM" value={`${r.bestOneRm} kg`} />
              <Cell label="Volume" value={`${Math.round(r.volume).toLocaleString()}`} />
            </div>
          </li>
        ))}
      </ul>

      <BottomNav />
    </main>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted py-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-xl text-foreground">{value}</p>
    </div>
  );
}
