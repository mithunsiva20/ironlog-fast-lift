export type SetEntry = {
  id: string;
  reps: number;
  weight: number;
  done: boolean;
};

export type ExerciseEntry = {
  id: string;
  name: string;
  sets: SetEntry[];
};

export type Workout = {
  id: string;
  name: string;
  startedAt: number;
  finishedAt: number | null;
  exercises: ExerciseEntry[];
};

const HISTORY_KEY = "ironlog.history.v1";
const ACTIVE_KEY = "ironlog.active.v1";

export const uid = () => Math.random().toString(36).slice(2, 10);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export const loadHistory = () => read<Workout[]>(HISTORY_KEY, []);
export const saveHistory = (w: Workout[]) => write(HISTORY_KEY, w);
export const loadActive = () => read<Workout | null>(ACTIVE_KEY, null);
export const saveActive = (w: Workout | null) => write(ACTIVE_KEY, w);

export const COMMON_EXERCISES = [
  "Back Squat",
  "Bench Press",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Pull Up",
  "Front Squat",
  "Romanian Deadlift",
  "Incline Bench Press",
  "Lat Pulldown",
  "Dumbbell Curl",
  "Tricep Pushdown",
  "Leg Press",
  "Hip Thrust",
];

export const epley = (weight: number, reps: number) =>
  reps > 0 && weight > 0 ? Math.round(weight * (1 + reps / 30)) : 0;

export const normalize = (name: string) => name.trim().toLowerCase();

/** Last completed sets logged for an exercise, most recent first. */
export function lastSetsFor(history: Workout[], name: string): SetEntry[] | null {
  const key = normalize(name);
  for (const w of [...history].sort((a, b) => b.startedAt - a.startedAt)) {
    const ex = w.exercises.find((e) => normalize(e.name) === key);
    const done = ex?.sets.filter((s) => s.done) ?? [];
    if (done.length) return done;
  }
  return null;
}

export type Record = {
  name: string;
  bestWeight: number;
  bestReps: number;
  bestOneRm: number;
  volume: number;
  lastDate: number;
};

export function computeRecords(history: Workout[]): Record[] {
  const map = new Map<string, Record>();
  for (const w of history) {
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (!s.done || s.weight <= 0 || s.reps <= 0) continue;
        const key = normalize(ex.name);
        const cur =
          map.get(key) ??
          ({
            name: ex.name,
            bestWeight: 0,
            bestReps: 0,
            bestOneRm: 0,
            volume: 0,
            lastDate: 0,
          } as Record);
        const orm = epley(s.weight, s.reps);
        if (s.weight > cur.bestWeight) {
          cur.bestWeight = s.weight;
          cur.bestReps = s.reps;
        }
        cur.bestOneRm = Math.max(cur.bestOneRm, orm);
        cur.volume += s.weight * s.reps;
        cur.lastDate = Math.max(cur.lastDate, w.startedAt);
        map.set(key, cur);
      }
    }
  }
  return [...map.values()].sort((a, b) => b.bestOneRm - a.bestOneRm);
}

/** True when this set beats every previously recorded set for the exercise. */
export function isPersonalRecord(history: Workout[], name: string, set: SetEntry) {
  if (set.weight <= 0 || set.reps <= 0) return false;
  const rec = computeRecords(history).find((r) => normalize(r.name) === normalize(name));
  if (!rec) return true;
  return epley(set.weight, set.reps) > rec.bestOneRm;
}

export function workoutVolume(w: Workout) {
  return w.exercises.reduce(
    (t, e) => t + e.sets.reduce((s, x) => s + (x.done ? x.weight * x.reps : 0), 0),
    0,
  );
}

export function workoutSetCount(w: Workout) {
  return w.exercises.reduce((t, e) => t + e.sets.filter((s) => s.done).length, 0);
}

export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
