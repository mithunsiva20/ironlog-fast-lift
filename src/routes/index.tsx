import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Flame, Plus, Search, Trash2, Trophy } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { RestTimer } from "@/components/RestTimer";
import { useGym } from "@/hooks/use-gym";
import {
  COMMON_EXERCISES,
  epley,
  isPersonalRecord,
  lastSetsFor,
  uid,
  workoutSetCount,
  workoutVolume,
  type ExerciseEntry,
  type SetEntry,
  type Workout,
} from "@/lib/gym-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IronLog — Fast Gym Workout & Lifting Tracker" },
      {
        name: "description",
        content:
          "Log sets, reps and weight in seconds. Previous-set autofill, rest timer and automatic personal records for strength training.",
      },
      { property: "og:title", content: "IronLog — Fast Gym Workout & Lifting Tracker" },
      {
        property: "og:description",
        content:
          "Mobile-first strength tracker: sets, reps, weight, rest timer and personal records.",
      },
    ],
  }),
  component: TrainPage,
});

function TrainPage() {
  const { ready, history, active, updateActive, updateHistory } = useGym();
  const [restSeconds, setRestSeconds] = useState(90);
  const [restOpen, setRestOpen] = useState(false);
  const [picker, setPicker] = useState(false);
  const [prSet, setPrSet] = useState<string | null>(null);

  const setWorkout = (fn: (w: Workout) => Workout) => {
    if (!active) return;
    updateActive(fn(structuredClone(active)));
  };

  const startWorkout = () => {
    updateActive({
      id: uid(),
      name: "Workout",
      startedAt: Date.now(),
      finishedAt: null,
      exercises: [],
    });
    setPicker(true);
  };

  const addExercise = (name: string) => {
    setWorkout((w) => {
      const prev = lastSetsFor(history, name);
      const sets: SetEntry[] =
        prev?.map((s) => ({ id: uid(), reps: s.reps, weight: s.weight, done: false })) ??
        [{ id: uid(), reps: 8, weight: 0, done: false }];
      w.exercises.push({ id: uid(), name, sets });
      return w;
    });
    setPicker(false);
  };

  const updateSet = (exId: string, setId: string, patch: Partial<SetEntry>) =>
    setWorkout((w) => {
      const ex = w.exercises.find((e) => e.id === exId);
      const s = ex?.sets.find((x) => x.id === setId);
      if (s) Object.assign(s, patch);
      return w;
    });

  const toggleDone = (ex: ExerciseEntry, set: SetEntry) => {
    const nowDone = !set.done;
    if (nowDone && isPersonalRecord(history, ex.name, set)) {
      setPrSet(set.id);
      window.setTimeout(() => setPrSet(null), 2500);
    }
    updateSet(ex.id, set.id, { done: nowDone });
    if (nowDone) setRestOpen(true);
  };

  const addSet = (exId: string) =>
    setWorkout((w) => {
      const ex = w.exercises.find((e) => e.id === exId);
      const last = ex?.sets[ex.sets.length - 1];
      ex?.sets.push({
        id: uid(),
        reps: last?.reps ?? 8,
        weight: last?.weight ?? 0,
        done: false,
      });
      return w;
    });

  const removeExercise = (exId: string) =>
    setWorkout((w) => {
      w.exercises = w.exercises.filter((e) => e.id !== exId);
      return w;
    });

  const finish = () => {
    if (!active) return;
    const cleaned: Workout = {
      ...active,
      finishedAt: Date.now(),
      exercises: active.exercises
        .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
        .filter((e) => e.sets.length > 0),
    };
    if (cleaned.exercises.length) updateHistory([cleaned, ...history]);
    updateActive(null);
    setRestOpen(false);
  };

  const lastWorkout = history[0];

  return (
    <main className="mx-auto min-h-screen max-w-md bg-background pb-28">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pt-6">
        <div className="min-w-0">
          <h1 className="font-display text-4xl leading-none tracking-wide text-foreground">
            IronLog
          </h1>
          <p className="truncate text-xs uppercase tracking-widest text-muted-foreground">
            {active ? "Session in progress" : "Ready to lift"}
          </p>
        </div>
        {active ? (
          <button
            onClick={finish}
            className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-bold uppercase tracking-wide text-accent-foreground"
          >
            Finish
          </button>
        ) : null}
      </header>

      {!ready ? null : !active ? (
        <section className="px-4 pt-8">
          <button
            onClick={startWorkout}
            className="w-full rounded-2xl bg-accent py-5 font-display text-2xl tracking-wide text-accent-foreground shadow-lg"
          >
            Start Workout
          </button>
          {lastWorkout ? (
            <div className="mt-6 rounded-2xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Last session
              </p>
              <p className="mt-1 font-display text-2xl text-foreground">
                {workoutSetCount(lastWorkout)} sets ·{" "}
                {Math.round(workoutVolume(lastWorkout)).toLocaleString()} kg
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {lastWorkout.exercises.map((e) => e.name).join(" · ")}
              </p>
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Your sets, records and rest timer all live on this device.
            </p>
          )}
        </section>
      ) : (
        <section className="space-y-4 px-3 pt-5">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Sets" value={String(workoutSetCount(active))} />
            <Stat
              label="Volume"
              value={`${Math.round(workoutVolume(active)).toLocaleString()} kg`}
            />
          </div>

          {active.exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              prevSets={lastSetsFor(history, ex.name)}
              prSetId={prSet}
              onToggle={(s) => toggleDone(ex, s)}
              onChange={(setId, patch) => updateSet(ex.id, setId, patch)}
              onAddSet={() => addSet(ex.id)}
              onRemove={() => removeExercise(ex.id)}
            />
          ))}

          <button
            onClick={() => setPicker(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-bold uppercase tracking-widest text-muted-foreground"
          >
            <Plus className="h-4 w-4" /> Add exercise
          </button>
        </section>
      )}

      {picker ? (
        <ExercisePicker onPick={addExercise} onClose={() => setPicker(false)} />
      ) : null}

      {restOpen ? (
        <RestTimer
          seconds={restSeconds}
          onChangeDefault={setRestSeconds}
          onClose={() => setRestOpen(false)}
        />
      ) : null}

      <BottomNav />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-2xl text-foreground">{value}</p>
    </div>
  );
}

function ExerciseCard({
  exercise,
  prevSets,
  prSetId,
  onToggle,
  onChange,
  onAddSet,
  onRemove,
}: {
  exercise: ExerciseEntry;
  prevSets: SetEntry[] | null;
  prSetId: string | null;
  onToggle: (s: SetEntry) => void;
  onChange: (setId: string, patch: Partial<SetEntry>) => void;
  onAddSet: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-3">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <h2 className="truncate font-display text-2xl tracking-wide text-foreground">
          {exercise.name}
        </h2>
        <button
          onClick={onRemove}
          aria-label={`Remove ${exercise.name}`}
          className="shrink-0 rounded-lg p-2 text-muted-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </header>

      <div className="mt-2 grid grid-cols-[28px_minmax(0,1fr)_64px_64px_44px] items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>#</span>
        <span>Previous</span>
        <span>Kg</span>
        <span>Reps</span>
        <span />
      </div>

      <ul className="mt-1 space-y-2">
        {exercise.sets.map((s, i) => {
          const prev = prevSets?.[i];
          return (
            <li
              key={s.id}
              className="grid grid-cols-[28px_minmax(0,1fr)_64px_64px_44px] items-center gap-2"
            >
              <span className="font-display text-lg text-muted-foreground">{i + 1}</span>
              <button
                onClick={() =>
                  prev ? onChange(s.id, { weight: prev.weight, reps: prev.reps }) : undefined
                }
                disabled={!prev}
                className="truncate rounded-lg bg-muted px-2 py-2 text-left text-xs text-muted-foreground disabled:opacity-50"
              >
                {prev ? `${prev.weight} kg × ${prev.reps}` : "—"}
              </button>
              <NumberField
                value={s.weight}
                step={2.5}
                onChange={(v) => onChange(s.id, { weight: v })}
              />
              <NumberField value={s.reps} step={1} onChange={(v) => onChange(s.id, { reps: v })} />
              <button
                onClick={() => onToggle(s)}
                aria-label={`Complete set ${i + 1}`}
                className={`relative flex h-10 items-center justify-center rounded-lg ${
                  s.done ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <Check className="h-5 w-5" />
                {prSetId === s.id ? (
                  <Trophy className="absolute -right-1 -top-2 h-4 w-4 text-chart-4" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <button
          onClick={onAddSet}
          className="rounded-xl bg-muted py-2 text-xs font-bold uppercase tracking-widest text-foreground"
        >
          + Add set
        </button>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Flame className="h-3.5 w-3.5" />
          {Math.max(
            0,
            ...exercise.sets.filter((s) => s.done).map((s) => epley(s.weight, s.reps)),
          )}{" "}
          e1RM
        </span>
      </div>
    </article>
  );
}

function NumberField({
  value,
  step,
  onChange,
}: {
  value: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => onChange(Number(e.currentTarget.value))}
      className="h-10 w-full rounded-lg border border-input bg-background px-2 text-center font-display text-lg text-foreground outline-none focus:border-accent"
    />
  );
}

function ExercisePicker({
  onPick,
  onClose,
}: {
  onPick: (name: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const results = useMemo(
    () => COMMON_EXERCISES.filter((e) => e.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-md flex-col p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="font-display text-3xl text-foreground">Add exercise</h2>
          <button
            onClick={onClose}
            className="shrink-0 text-sm font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Close
          </button>
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-xl border border-input bg-card px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
            placeholder="Search or type a new exercise"
            className="h-12 w-full bg-transparent text-foreground outline-none"
          />
        </label>
        <ul className="mt-3 flex-1 space-y-2 overflow-y-auto">
          {q.trim() && !results.some((r) => r.toLowerCase() === q.trim().toLowerCase()) ? (
            <li>
              <button
                onClick={() => onPick(q.trim())}
                className="w-full rounded-xl bg-accent px-4 py-3 text-left font-semibold text-accent-foreground"
              >
                Create “{q.trim()}”
              </button>
            </li>
          ) : null}
          {results.map((name) => (
            <li key={name}>
              <button
                onClick={() => onPick(name)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left font-semibold text-foreground"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
