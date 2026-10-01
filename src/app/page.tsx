"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight,
  Clock3, Dumbbell, Flame, Footprints, Heart, ListChecks, Moon, Pause, Play,
  Plus, Search, Settings2, SkipForward, Sparkles, Timer, Trash2, X, Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
type Exercise = {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  sets: number;
  reps: string;
  weight: string;
  note: string;
};
type DayWorkout = { name: string; rest: boolean; exercises: Exercise[] };
type WeeklySplit = Record<DayKey, DayWorkout>;
type Mode = "dashboard" | "active" | "complete";

const DAY_KEYS: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<DayKey, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
  friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};
const DAY_SHORT: Record<DayKey, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};
const STORAGE_KEY = "fitter.weekly-split.v1";
let exerciseSequence = 0;

const makeExercise = (
  name: string, muscle: string, equipment: string, sets = 3, reps = "8–10", weight = "", note = "",
): Exercise => ({
  id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${exerciseSequence++}`,
  name, muscle, equipment, sets, reps, weight, note,
});

const defaultSplit: WeeklySplit = {
  monday: {
    name: "Push day", rest: false, exercises: [
      makeExercise("Barbell bench press", "Chest", "Barbell", 4, "6–8", "60 kg", "Keep your feet planted and own the negative."),
      makeExercise("Incline dumbbell press", "Upper chest", "Dumbbell", 3, "8–10", "22 kg", "Set the bench to a low incline."),
      makeExercise("Seated shoulder press", "Shoulders", "Dumbbell", 3, "8–10", "16 kg"),
      makeExercise("Cable lateral raise", "Side delts", "Cable", 3, "12–15", "7.5 kg"),
      makeExercise("Rope triceps pushdown", "Triceps", "Cable", 3, "10–12", "25 kg"),
    ],
  },
  tuesday: {
    name: "Pull day", rest: false, exercises: [
      makeExercise("Lat pulldown", "Back", "Cable", 4, "8–10", "50 kg", "Drive elbows down, pause at the bottom."),
      makeExercise("Chest-supported row", "Mid back", "Dumbbell", 3, "8–10", "20 kg"),
      makeExercise("Face pull", "Rear delts", "Cable", 3, "12–15", "17.5 kg"),
      makeExercise("Incline dumbbell curl", "Biceps", "Dumbbell", 3, "10–12", "10 kg"),
    ],
  },
  wednesday: { name: "Rest day", rest: true, exercises: [] },
  thursday: {
    name: "Legs day", rest: false, exercises: [
      makeExercise("Barbell back squat", "Quads · Glutes", "Barbell", 4, "6–8", "70 kg", "Brace before every rep. Depth over load."),
      makeExercise("Romanian deadlift", "Hamstrings · Glutes", "Barbell", 3, "8–10", "50 kg"),
      makeExercise("Leg press", "Quads", "Machine", 3, "10–12", "120 kg"),
      makeExercise("Seated leg curl", "Hamstrings", "Machine", 3, "10–12", "35 kg"),
      makeExercise("Standing calf raise", "Calves", "Machine", 3, "12–15", "40 kg"),
    ],
  },
  friday: { name: "Rest day", rest: true, exercises: [] },
  saturday: {
    name: "Upper day", rest: false, exercises: [
      makeExercise("Dumbbell bench press", "Chest", "Dumbbell", 3, "8–10", "20 kg"),
      makeExercise("Seated cable row", "Back", "Cable", 3, "8–10", "45 kg"),
      makeExercise("Dumbbell lateral raise", "Shoulders", "Dumbbell", 3, "12–15", "8 kg"),
      makeExercise("EZ-bar curl", "Biceps", "EZ bar", 3, "10–12", "20 kg"),
    ],
  },
  sunday: { name: "Rest day", rest: true, exercises: [] },
};

const library: Omit<Exercise, "id" | "sets" | "reps" | "weight" | "note">[] = [
  { name: "Barbell bench press", muscle: "Chest", equipment: "Barbell" },
  { name: "Incline barbell bench press", muscle: "Chest", equipment: "Barbell" },
  { name: "Decline barbell bench press", muscle: "Chest", equipment: "Barbell" },
  { name: "Dumbbell bench press", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Incline dumbbell press", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Cable chest fly", muscle: "Chest", equipment: "Cable" },
  { name: "Pec deck", muscle: "Chest", equipment: "Machine" },
  { name: "Push-up", muscle: "Chest", equipment: "Bodyweight" },
  { name: "Barbell back squat", muscle: "Quads", equipment: "Barbell" },
  { name: "Front squat", muscle: "Quads", equipment: "Barbell" },
  { name: "Leg press", muscle: "Quads", equipment: "Machine" },
  { name: "Leg extension", muscle: "Quads", equipment: "Machine" },
  { name: "Bulgarian split squat", muscle: "Quads", equipment: "Dumbbell" },
  { name: "Walking lunge", muscle: "Quads", equipment: "Dumbbell" },
  { name: "Romanian deadlift", muscle: "Hamstrings", equipment: "Barbell" },
  { name: "Seated leg curl", muscle: "Hamstrings", equipment: "Machine" },
  { name: "Lying leg curl", muscle: "Hamstrings", equipment: "Machine" },
  { name: "Barbell hip thrust", muscle: "Glutes", equipment: "Barbell" },
  { name: "Glute bridge", muscle: "Glutes", equipment: "Bodyweight" },
  { name: "Standing calf raise", muscle: "Calves", equipment: "Machine" },
  { name: "Lat pulldown", muscle: "Back", equipment: "Cable" },
  { name: "Pull-up", muscle: "Back", equipment: "Bodyweight" },
  { name: "Assisted pull-up", muscle: "Back", equipment: "Machine" },
  { name: "Barbell bent-over row", muscle: "Back", equipment: "Barbell" },
  { name: "Single-arm dumbbell row", muscle: "Back", equipment: "Dumbbell" },
  { name: "Chest-supported row", muscle: "Back", equipment: "Dumbbell" },
  { name: "Seated cable row", muscle: "Back", equipment: "Cable" },
  { name: "Straight-arm pulldown", muscle: "Back", equipment: "Cable" },
  { name: "Face pull", muscle: "Shoulders", equipment: "Cable" },
  { name: "Seated shoulder press", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Overhead barbell press", muscle: "Shoulders", equipment: "Barbell" },
  { name: "Dumbbell lateral raise", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Cable lateral raise", muscle: "Shoulders", equipment: "Cable" },
  { name: "Reverse pec deck", muscle: "Shoulders", equipment: "Machine" },
  { name: "EZ-bar curl", muscle: "Biceps", equipment: "EZ bar" },
  { name: "Incline dumbbell curl", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Hammer curl", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Cable curl", muscle: "Biceps", equipment: "Cable" },
  { name: "Rope triceps pushdown", muscle: "Triceps", equipment: "Cable" },
  { name: "Overhead cable extension", muscle: "Triceps", equipment: "Cable" },
  { name: "Skull crusher", muscle: "Triceps", equipment: "EZ bar" },
  { name: "Bench dip", muscle: "Triceps", equipment: "Bodyweight" },
  { name: "Plank", muscle: "Core", equipment: "Bodyweight" },
  { name: "Hanging knee raise", muscle: "Core", equipment: "Bodyweight" },
  { name: "Cable crunch", muscle: "Core", equipment: "Cable" },
  { name: "Dead bug", muscle: "Core", equipment: "Bodyweight" },
  { name: "Treadmill run", muscle: "Cardio", equipment: "Treadmill" },
  { name: "Incline walk", muscle: "Cardio", equipment: "Treadmill" },
  { name: "Stationary bike", muscle: "Cardio", equipment: "Bike" },
  { name: "Rowing machine", muscle: "Cardio", equipment: "Rower" },
  { name: "Jump rope", muscle: "Cardio", equipment: "Bodyweight" },
];

const muscleCategories = ["All", "Chest", "Back", "Shoulders", "Biceps", "Triceps", "Quads", "Hamstrings", "Glutes", "Calves", "Core", "Cardio"];

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const remaining = (seconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${remaining}`;
}

function getTodayKey(): DayKey {
  const day = new Date().getDay();
  return DAY_KEYS[(day + 6) % 7];
}

function getMonIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "focus-brand" : ""}`}>
      <span className="brand-mark"><Zap aria-hidden="true" /></span>
      <span>fitter</span>
    </div>
  );
}

function WorkoutTimer({ seconds }: { seconds: number }) {
  return (
    <div className="timer-panel" aria-live="off">
      <motion.div className="timer-ring" animate={{ boxShadow: ["0 0 18px rgba(193,243,106,.035)", "0 0 34px rgba(193,243,106,.12)", "0 0 18px rgba(193,243,106,.035)"] }} transition={{ duration: 3.6, repeat: Infinity }}>
        <Timer size={19} strokeWidth={1.7} />
      </motion.div>
      <div><span className="timer-reading">{formatTime(seconds)}</span><span className="timer-caption">Workout elapsed</span></div>
    </div>
  );
}

function ExerciseCard({
  exercise, index, total, logged, onToggleSet,
}: {
  exercise: Exercise; index: number; total: number; logged: number[]; onToggleSet: (set: number) => void;
}) {
  return (
    <motion.article className="focus-card" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: .26, ease: "easeOut" }}>
      <div className="focus-card-head">
        <div>
          <span className="exercise-index">Exercise {index + 1} <span style={{ color: "#68766a" }}>/ {total}</span></span>
          <div className="focus-muscle"><span className="muscle-tag">{exercise.muscle}</span><span className="muscle-tag">{exercise.equipment}</span></div>
        </div>
        <span style={{ color: "#768277", fontSize: 10 }}>{logged.length}/{exercise.sets} sets</span>
      </div>
      <h1 className="focus-exercise-title">{exercise.name}</h1>
      <div className="focus-equipment">Stay smooth. Make every rep look the same.</div>
      <div className="target-row">
        <div className="target-cell"><span className="target-label">Working sets</span><span className="target-value">{exercise.sets} sets</span></div>
        <div className="target-cell"><span className="target-label">Target reps</span><span className="target-value">{exercise.reps}</span></div>
        <div className="target-cell"><span className="target-label">Target load</span><span className="target-value">{exercise.weight || "—"}</span></div>
      </div>
      {exercise.note && <p className="notes-line"><Sparkles size={13} />{exercise.note}</p>}
      <div className="set-list">
        <div className="set-heading"><span>Set log</span><span>Tap when complete</span></div>
        {Array.from({ length: exercise.sets }, (_, set) => {
          const checked = logged.includes(set);
          return (
            <div className={`set-row ${checked ? "done" : ""}`} key={set}>
              <span className="set-name"><span className="set-number">{String(set + 1).padStart(2, "0")}</span>Set {set + 1} <span style={{ color: "#77847a" }}>· {exercise.reps} reps</span></span>
              <button className={`set-check ${checked ? "checked" : ""}`} onClick={() => onToggleSet(set)} aria-label={`${checked ? "Unlog" : "Log"} set ${set + 1}`}>
                {checked && <Check size={13} strokeWidth={3} />}
              </button>
            </div>
          );
        })}
      </div>
    </motion.article>
  );
}

function ExerciseLibrary({
  open, onOpenChange, onAdd, addedIds,
}: {
  open: boolean; onOpenChange: (open: boolean) => void; onAdd: (item: typeof library[number]) => void; addedIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const filtered = useMemo(() => library.filter((item) => {
    const matchesCategory = category === "All" || item.muscle === category;
    const matchesQuery = `${item.name} ${item.muscle} ${item.equipment}`.toLowerCase().includes(query.toLowerCase().trim());
    return matchesCategory && matchesQuery;
  }), [category, query]);
  useEffect(() => { if (!open) { setQuery(""); setCategory("All"); } }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content wide">
          <div className="dialog-head">
            <div><div className="dialog-kicker">Exercise database · 51 movements</div><Dialog.Title className="dialog-title" style={{ margin: 0 }}>Add an exercise</Dialog.Title><Dialog.Description className="dialog-desc" style={{ margin: 0 }}>Build a session that works for you.</Dialog.Description></div>
            <Dialog.Close asChild><button className="dialog-close" aria-label="Close exercise library"><X size={15} /></button></Dialog.Close>
          </div>
          <div className="dialog-body">
            <label className="library-search"><Search size={15} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises or muscle groups" /></label>
            <div className="category-row" role="tablist" aria-label="Filter exercise category">
              {muscleCategories.map((item) => <button key={item} role="tab" aria-selected={category === item} className={`category-chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
            <div className="library-list">
              {filtered.map((item) => {
                const id = item.name.toLowerCase();
                const added = addedIds.includes(id);
                return <div className="library-item" key={item.name}>
                  <div style={{ minWidth: 0 }}><div className="library-item-name">{item.name}</div><div className="library-item-meta">{item.muscle} · {item.equipment}</div></div>
                  <button className={`library-add ${added ? "added" : ""}`} aria-label={`${added ? "Add another" : "Add"} ${item.name}`} onClick={() => onAdd(item)}>{added ? <Check size={14} /> : <Plus size={14} />}</button>
                </div>;
              })}
              {filtered.length === 0 && <div className="library-empty">No movements found. Try a different search.</div>}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SplitEditorModal({
  day, workout, onClose, onSave,
}: {
  day: DayKey | null; workout: DayWorkout; onClose: () => void; onSave: (day: DayKey, workout: DayWorkout) => void;
}) {
  const [draft, setDraft] = useState(workout);
  const [showLibrary, setShowLibrary] = useState(false);
  useEffect(() => { setDraft(workout); }, [workout, day]);
  const updateExercise = (id: string, field: keyof Exercise, value: string | number) => {
    setDraft((previous) => ({ ...previous, exercises: previous.exercises.map((exercise) => exercise.id === id ? { ...exercise, [field]: value } : exercise) }));
  };
  const addExercise = (item: typeof library[number]) => {
    setDraft((previous) => ({ ...previous, rest: false, name: previous.rest ? "Workout" : previous.name, exercises: [...previous.exercises, makeExercise(item.name, item.muscle, item.equipment)] }));
  };
  const removeExercise = (id: string) => setDraft((previous) => ({ ...previous, exercises: previous.exercises.filter((item) => item.id !== id) }));
  if (!day) return null;

  return (
    <Dialog.Root open={Boolean(day)} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content wide">
          <div className="dialog-head">
            <div><div className="dialog-kicker">Weekly split · {DAY_LABELS[day]}</div><Dialog.Title className="dialog-title" style={{ margin: 0 }}>Edit your session</Dialog.Title><Dialog.Description className="dialog-desc" style={{ margin: 0 }}>Tune the work. Your changes save on this device.</Dialog.Description></div>
            <Dialog.Close asChild><button className="dialog-close" aria-label="Close editor"><X size={15} /></button></Dialog.Close>
          </div>
          <div className="dialog-body">
            <div className="editor-topline">
              <div><label className="field-label" htmlFor="workout-name">Session name</label><input id="workout-name" className="field-input" value={draft.name} disabled={draft.rest} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Upper body" /></div>
              <button className={`rest-toggle ${draft.rest ? "enabled" : ""}`} onClick={() => setDraft((previous) => ({ ...previous, rest: !previous.rest, name: previous.rest ? "Workout" : "Rest day", exercises: previous.rest ? previous.exercises : [] }))}>
                <Moon size={14} />{draft.rest ? "Rest day" : "Mark as rest"}
              </button>
            </div>
            {!draft.rest && <>
              <div className="editor-section-title">Exercise plan <span>{draft.exercises.length} movements</span></div>
              {draft.exercises.map((exercise, index) => <div className="editor-exercise" key={exercise.id}>
                <div className="editor-exercise-head"><div><div className="editor-exercise-name">{String(index + 1).padStart(2, "0")} &nbsp; {exercise.name}</div><div className="editor-exercise-muscle">{exercise.muscle} · {exercise.equipment}</div></div><button className="icon-quiet" aria-label={`Remove ${exercise.name}`} onClick={() => removeExercise(exercise.id)}><Trash2 size={14} /></button></div>
                <div className="exercise-fields">
                  <div><label className="field-label">Sets</label><input className="field-input" type="number" min="1" max="12" value={exercise.sets} onChange={(event) => updateExercise(exercise.id, "sets", Math.max(1, Number(event.target.value) || 1))} /></div>
                  <div><label className="field-label">Reps</label><input className="field-input" value={exercise.reps} onChange={(event) => updateExercise(exercise.id, "reps", event.target.value)} placeholder="8–10" /></div>
                  <div><label className="field-label">Target weight</label><input className="field-input" value={exercise.weight} onChange={(event) => updateExercise(exercise.id, "weight", event.target.value)} placeholder="e.g. 40 kg" /></div>
                </div>
                <div className="exercise-note-field"><label className="field-label">Personal note</label><input className="field-input" value={exercise.note} onChange={(event) => updateExercise(exercise.id, "note", event.target.value)} placeholder="Cue, form reminder, or focus" /></div>
              </div>)}
              {draft.exercises.length === 0 && <div className="editor-empty">Start with one movement, then build your session around it.</div>}
              <button className="add-exercise-button" style={{ marginTop: 11 }} onClick={() => setShowLibrary(true)}><Plus size={13} />Add from exercise library</button>
            </>}
            {draft.rest && <div className="editor-empty" style={{ marginTop: 18 }}>A day to recover. Your future self will thank you.</div>}
            <div className="dialog-footer"><button className="quiet-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={() => onSave(day, draft)}><Check size={15} />Save {draft.rest ? "day" : "session"}</button></div>
          </div>
          <ExerciseLibrary open={showLibrary} onOpenChange={setShowLibrary} onAdd={addExercise} addedIds={draft.exercises.map((exercise) => exercise.name.toLowerCase())} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function Home() {
  const [split, setSplit] = useState<WeeklySplit>(defaultSplit);
  const [selectedDay, setSelectedDay] = useState<DayKey>("monday");
  const [today, setToday] = useState<DayKey>("monday");
  const [todayDate, setTodayDate] = useState<Date | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"train" | "plan">("train");
  const [editingDay, setEditingDay] = useState<DayKey | null>(null);
  const [mode, setMode] = useState<Mode>("dashboard");
  const [activeWorkout, setActiveWorkout] = useState<DayWorkout | null>(null);
  const [activeWorkoutName, setActiveWorkoutName] = useState("");
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [loggedSets, setLoggedSets] = useState<Record<string, number[]>>({});
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [restDuration, setRestDuration] = useState(60);
  const [restEndsAt, setRestEndsAt] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const now = new Date();
    const actualToday = getTodayKey();
    setToday(actualToday);
    setSelectedDay(actualToday);
    setTodayDate(now);
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WeeklySplit;
        if (parsed && DAY_KEYS.every((key) => parsed[key] && typeof parsed[key].name === "string" && Array.isArray(parsed[key].exercises))) setSplit(parsed);
      }
    } catch { /* Ignore a damaged local preference and use the starter plan. */ }
    setReady(true);
  }, []);

  useEffect(() => { if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(split)); }, [ready, split]);

  useEffect(() => {
    if (mode !== "active" || !startedAt) return;
    const interval = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(interval);
  }, [mode, startedAt]);

  useEffect(() => {
    if (mode !== "active" || !restEndsAt) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRestRemaining(remaining);
      if (remaining === 0) setRestEndsAt(0);
    };
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [mode, restEndsAt]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const selectedWorkout = split[selectedDay];
  const activeExercise = activeWorkout?.exercises[exerciseIndex];
  const currentLogged = activeExercise ? loggedSets[activeExercise.id] ?? [] : [];
  const formattedDate = todayDate ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(todayDate) : "Your training week";
  const workoutDay = DAY_LABELS[selectedDay];

  const saveWorkout = (day: DayKey, workout: DayWorkout) => {
    setSplit((previous) => ({ ...previous, [day]: workout }));
    setEditingDay(null);
    setToast("Split updated · saved on this device");
  };

  const beginWorkout = (workout: DayWorkout, name: string) => {
    if (workout.exercises.length === 0) { setToast("Add an exercise before starting"); return; }
    const now = Date.now();
    setActiveWorkout(workout);
    setActiveWorkoutName(name);
    setExerciseIndex(0);
    setLoggedSets({});
    setElapsed(0);
    setStartedAt(now);
    setRestEndsAt(0);
    setRestRemaining(0);
    setMode("active");
  };

  const quickWorkout = () => {
    const quick: DayWorkout = {
      name: "Quick session", rest: false, exercises: [
        makeExercise("Goblet squat", "Quads · Glutes", "Dumbbell", 3, "10–12", ""),
        makeExercise("Push-up", "Chest", "Bodyweight", 3, "8–12", ""),
        makeExercise("Single-arm dumbbell row", "Back", "Dumbbell", 3, "10 each", ""),
        makeExercise("Plank", "Core", "Bodyweight", 3, "30–45 sec", ""),
      ],
    };
    beginWorkout(quick, "Quick session");
  };

  const changeSet = (set: number) => {
    if (!activeExercise) return;
    setLoggedSets((previous) => {
      const existing = previous[activeExercise.id] ?? [];
      const next = existing.includes(set) ? existing.filter((value) => value !== set) : [...existing, set];
      return { ...previous, [activeExercise.id]: next };
    });
  };

  const moveExercise = useCallback((direction: 1 | -1) => {
    if (!activeWorkout) return;
    setRestEndsAt(0);
    setRestRemaining(0);
    const nextIndex = exerciseIndex + direction;
    if (nextIndex < 0) return;
    if (nextIndex >= activeWorkout.exercises.length) {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      setMode("complete");
      return;
    }
    setExerciseIndex(nextIndex);
  }, [activeWorkout, exerciseIndex, startedAt]);

  const startRest = () => {
    const endsAt = Date.now() + restDuration * 1000;
    setRestEndsAt(endsAt);
    setRestRemaining(restDuration);
  };

  const dayIndex = getMonIndex(todayDate ?? new Date(2025, 0, 6));
  const workoutCount = DAY_KEYS.filter((day) => !split[day].rest && split[day].exercises.length > 0).length;
  const weeklyExerciseCount = DAY_KEYS.reduce((sum, day) => sum + split[day].exercises.length, 0);
  const isRestDay = selectedWorkout.rest || selectedWorkout.exercises.length === 0;

  return (
    <div className="app-shell">
      <div className="noise-layer" />
      {mode === "dashboard" && <>
        <header className="topbar">
          <div className="topbar-inner">
            <Brand />
            <nav className="top-nav" aria-label="Main navigation">
              <button className={`nav-link ${tab === "train" ? "active" : ""}`} onClick={() => setTab("train")}>Today</button>
              <button className={`nav-link ${tab === "plan" ? "active" : ""}`} onClick={() => setTab("plan")}>Your split</button>
            </nav>
            <div className="topbar-meta"><span className="status-pill"><span className="status-dot" />Ready when you are</span><span className="avatar" aria-label="Your profile">FT</span></div>
          </div>
        </header>
        <main className="page-wrap">
          {tab === "train" ? <motion.div key="train-view" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .32 }}>
            <div className="page-heading">
              <div><div className="eyebrow"><span className="status-dot" />{selectedDay === today ? "Your training day" : "A look ahead"}</div><h1>Show up. Get after it.</h1><p>{selectedDay === today ? formattedDate : `${workoutDay} · ${selectedWorkout.name}`}</p></div>
              <button className="quiet-button" onClick={() => setEditingDay(selectedDay)}><Settings2 size={14} />Edit split</button>
            </div>

            <section className="hero-card">
              <div className="hero-grid">
                <div className="hero-copy">
                  <div className="eyebrow"><Flame size={13} />{isRestDay ? "Recovery is part of the work" : `${selectedWorkout.exercises.length} movements · built for you`}</div>
                  <div className="hero-date">{selectedDay === today ? "UP NEXT" : workoutDay.toUpperCase()}</div>
                  <h2 className="hero-title">{isRestDay ? <>Take the<br /><span className="accent">day back.</span></> : <>{selectedWorkout.name.split(" ")[0]}<br /><span className="accent">day.</span></>}</h2>
                  <p className="hero-subtitle">{isRestDay ? "Rest, recharge, and let the work settle in. Or build a quick session if you’re feeling it." : "A focused session, one rep at a time. Your plan is ready when you are."}</p>
                  <div className="hero-actions">
                    <button className="primary-button" onClick={() => isRestDay ? quickWorkout() : beginWorkout(selectedWorkout, selectedWorkout.name)}><Play size={15} fill="currentColor" />{isRestDay ? "Start quick workout" : "Start workout"}<ArrowRight size={15} /></button>
                    <button className="text-button" onClick={() => isRestDay ? setTab("plan") : quickWorkout()}>{isRestDay ? "View weekly split" : "Start quick session"} {isRestDay ? <ArrowUpRight size={14} /> : <Zap size={13} />}</button>
                  </div>
                </div>
                <div className="hero-side" aria-hidden="true">
                  <div className="orbit" /><div className="orbit-core" />
                  <div className="blueprint">
                    <div className="blueprint-top"><span>{isRestDay ? "Recovery notes" : "Session blueprint"}</span><span className="blueprint-count">{isRestDay ? "OFF DAY" : `${selectedWorkout.exercises.length} MOVEMENTS`}</span></div>
                    {isRestDay ? <><div className="blueprint-row"><span className="blueprint-num"><Heart size={13} /></span><span className="blueprint-name">Walk it out<span className="blueprint-detail">20 min · easy pace</span></span><ChevronRight className="blueprint-arrow" size={14} /></div><div className="blueprint-row"><span className="blueprint-num"><Moon size={13} /></span><span className="blueprint-name">Get some sleep<span className="blueprint-detail">Recovery starts here</span></span><ChevronRight className="blueprint-arrow" size={14} /></div></> : selectedWorkout.exercises.slice(0, 4).map((exercise, index) => <div className="blueprint-row" key={exercise.id}><span className="blueprint-num">{String(index + 1).padStart(2, "0")}</span><span className="blueprint-name">{exercise.name}<span className="blueprint-detail">{exercise.sets} sets · {exercise.reps} reps</span></span><ChevronRight className="blueprint-arrow" size={14} /></div>)}
                    <div className="blueprint-footer"><span>{isRestDay ? "UP NEXT" : "EST. DURATION"}</span><strong>{isRestDay ? "You’ve earned it" : `~${Math.max(30, selectedWorkout.exercises.length * 12)} min`}</strong></div>
                  </div>
                </div>
              </div>
            </section>

            <section className="metric-row" aria-label="Your training stats">
              <div className="metric"><span className="metric-icon"><Dumbbell size={16} /></span><span><span className="metric-label">Training days</span><span className="metric-value">{workoutCount} days / week</span></span></div>
              <div className="metric"><span className="metric-icon"><ListChecks size={16} /></span><span><span className="metric-label">Planned movements</span><span className="metric-value">{weeklyExerciseCount} exercises</span></span></div>
              <div className="metric"><span className="metric-icon"><Clock3 size={16} /></span><span><span className="metric-label">Next milestone</span><span className="metric-value">One session at a time</span></span></div>
            </section>

            <section>
              <div className="section-head"><div><h2>Your week, at a glance</h2><p>Choose a day to see what’s on the plan.</p></div><button className="text-button" onClick={() => setTab("plan")}>Manage split <ArrowRight size={13} /></button></div>
              <div className="week-strip">
                {DAY_KEYS.map((day, index) => {
                  const date = new Date(todayDate ?? new Date(2025, 0, 6));
                  date.setDate(date.getDate() - dayIndex + index);
                  const isCurrentDate = today === day;
                  return <button key={day} className={`day-chip ${selectedDay === day ? "selected" : ""} ${isCurrentDate ? "today" : ""}`} onClick={() => setSelectedDay(day)} aria-pressed={selectedDay === day}>
                    <span className="day-abbr">{DAY_SHORT[day]}</span><span className="day-date">{date.getDate()}</span><span className="day-kind">{split[day].rest ? "Rest" : split[day].name.replace(/ day/i, "")}</span>
                  </button>;
                })}
              </div>
            </section>

            {!isRestDay ? <div className="below-grid">
              <section><div className="section-head"><div><h2>Today’s line-up</h2><p>A quick look at the work ahead.</p></div><span className="eyebrow" style={{ fontSize: 9 }}>{selectedWorkout.exercises.length} EXERCISES</span></div>
                <div className="exercise-list">{selectedWorkout.exercises.map((exercise, index) => <div className="exercise-row" key={exercise.id}><span className="exercise-thumb">{index === 0 ? <Dumbbell size={15} /> : index === selectedWorkout.exercises.length - 1 ? <Zap size={15} /> : <Footprints size={15} />}</span><div><div className="exercise-title">{exercise.name}</div><div className="exercise-meta">{exercise.muscle} · {exercise.sets} sets · {exercise.reps} reps</div></div><span className="exercise-tag">{exercise.weight || exercise.equipment}</span></div>)}</div>
              </section>
              <aside className="side-note"><div className="side-note-title"><Sparkles size={14} color="#c1f36a" />Keep your focus</div><p>One good session won’t change everything. But it changes how you show up tomorrow. Keep the phone down and the reps clean.</p><div className="side-note-bottom"><span>CONSISTENCY OVER INTENSITY</span><span className="tiny-progress"><span /></span></div></aside>
            </div> : <section className="rest-card"><span className="rest-icon"><Moon size={18} /></span><div><strong>Recovery is training, too.</strong><p>Take a walk, get a full night’s sleep, and come back ready. You can always use the quick workout button above.</p></div></section>}
          </motion.div> : <motion.div key="plan-view" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .32 }}>
            <div className="page-heading"><div><div className="eyebrow"><ListChecks size={13} />Your training rhythm</div><h1>A plan that moves with you.</h1><p>Four focused sessions. Room to recover. Yours to shape.</p></div><button className="quiet-button" onClick={() => setEditingDay(today)}><Plus size={14} />Edit today</button></div>
            <div className="section-head" style={{ marginTop: 34 }}><div><h2>The weekly split</h2><p>Tap any day to edit movements, sets, reps, and target load.</p></div><span className="status-pill"><span className="status-dot" />{workoutCount} sessions per week</span></div>
            <div className="plan-grid">
              {DAY_KEYS.map((day) => <button key={day} className={`plan-card ${day === today ? "current" : ""}`} onClick={() => setEditingDay(day)}>
                <span className="plan-day">{DAY_LABELS[day]} {day === today && <span style={{ color: "var(--acid)" }}>· TODAY</span>}</span>
                {split[day].rest ? <><Moon className="plan-icon" size={17} /><div className="plan-name">Rest & recover</div><div className="plan-meta">A little space to reset</div></> : <><Dumbbell className="plan-icon" size={17} /><div className="plan-name">{split[day].name}</div><div className="plan-meta">{split[day].exercises.length} movements · {Math.max(30, split[day].exercises.length * 12)} min</div></>}
                <span className="plan-edit">Edit day <ArrowUpRight size={11} style={{ verticalAlign: "middle" }} /></span>
              </button>)}
            </div>
            <div className="below-grid" style={{ marginTop: 40 }}><div className="side-note"><div className="side-note-title"><Sparkles size={14} color="#c1f36a" />A strong week has a rhythm</div><p>Keep the hard days focused and the rest days intentional. Adjust the plan around your life, then show up for the next session.</p><button className="text-button" onClick={() => setEditingDay("monday")}>Customize your plan <ArrowRight size={13} /></button></div><div className="side-note"><div className="side-note-title"><Clock3 size={14} color="#c1f36a" />Made for real life</div><p>Your split is stored on this device, so it’s ready every time you open fitter—even when the gym Wi-Fi isn’t.</p><div className="side-note-bottom"><span>LOCAL SAVE ENABLED</span><span className="status-dot" /></div></div></div>
          </motion.div>}
        </main>
      </>}

      <AnimatePresence mode="wait">
        {mode === "active" && activeWorkout && activeExercise && <motion.div key="active" className="focus-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .23 }}>
          <header className="focus-top"><Brand compact /><div className="focus-status"><span className="status-dot" />Focus mode <span style={{ color: "#536057" }}>·</span> {activeWorkoutName}</div><button className="focus-close" aria-label="Exit workout" onClick={() => { setMode("dashboard"); setTab("train"); setRestEndsAt(0); }}><X size={16} /></button></header>
          <main className="focus-main"><WorkoutTimer seconds={elapsed} />
            <div className="focus-progress"><div className="progress-copy"><span><strong>{activeWorkoutName}</strong> · {selectedDay === today ? "Today" : workoutDay}</span><span>Exercise {exerciseIndex + 1} of {activeWorkout.exercises.length}</span></div><div className="progress-track"><motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${((exerciseIndex + 1) / activeWorkout.exercises.length) * 100}%` }} transition={{ duration: .4 }} /></div></div>
            <AnimatePresence mode="wait"><ExerciseCard key={activeExercise.id} exercise={activeExercise} index={exerciseIndex} total={activeWorkout.exercises.length} logged={currentLogged} onToggleSet={changeSet} /></AnimatePresence>
            <div className="focus-controls">
              <div className="control-left"><button className="icon-button" aria-label="Previous exercise" disabled={exerciseIndex === 0} onClick={() => moveExercise(-1)}><ChevronLeft size={17} /></button><button className="icon-button" aria-label="Skip this exercise" onClick={() => moveExercise(1)}><SkipForward size={16} /></button><label className="rest-control"><Timer size={13} /><select aria-label="Rest timer duration" value={restDuration} onChange={(event) => setRestDuration(Number(event.target.value))}><option value={60}>60s rest</option><option value={90}>90s rest</option><option value={120}>120s rest</option></select><ChevronDown size={11} /></label><button className="icon-button" aria-label={restRemaining ? "Stop rest timer" : "Start rest timer"} onClick={() => { if (restRemaining) { setRestEndsAt(0); setRestRemaining(0); } else startRest(); }}>{restRemaining ? <Pause size={15} /> : <Play size={15} />}</button>{restRemaining > 0 && <span className="rest-readout">{Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, "0")}</span>}</div>
              <div className="control-right"><button className="primary-button focus-next" onClick={() => moveExercise(1)}>{exerciseIndex === activeWorkout.exercises.length - 1 ? "Finish workout" : "Next exercise"}<ArrowRight size={14} /></button></div>
            </div>
            <div className="focus-footnote">{currentLogged.length === activeExercise.sets ? "All sets logged. Nice work." : "Your only job is the next rep."}</div>
          </main>
        </motion.div>}
        {mode === "complete" && <motion.div key="complete" className="focus-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .23 }}>
          <header className="focus-top"><Brand compact /><div className="focus-status"><span className="status-dot" />Session complete</div><button className="focus-close" aria-label="Back to dashboard" onClick={() => { setMode("dashboard"); setTab("train"); }}><X size={16} /></button></header>
          <main className="complete-shell">
            {Array.from({ length: 32 }, (_, index) => <motion.span key={index} className="confetti-piece" style={{ left: `${(index * 37) % 100}%`, backgroundColor: ["#c1f36a", "#8fce4e", "#efffce", "#708d56"][index % 4] }} initial={{ y: -25, rotate: 0, opacity: 0 }} animate={{ y: [0, 330 + (index % 5) * 38], rotate: [0, (index % 2 ? 1 : -1) * 420], opacity: [0, 1, 1, 0] }} transition={{ duration: 2.8 + (index % 7) * .22, delay: (index % 11) * .07, ease: "easeIn" }} />)}
            <motion.section className="complete-card" initial={{ opacity: 0, y: 16, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .4, delay: .1 }}>
              <motion.div className="complete-icon" animate={{ rotate: [0, -7, 7, 0], scale: [1, 1.06, 1] }} transition={{ duration: .65, delay: .35 }}><Check size={27} strokeWidth={2.7} /></motion.div>
              <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 11 }}><Sparkles size={13} />One for the books</div><h1>Work, done.</h1><p>You showed up and did the thing. Take that feeling with you.</p>
              <div className="recap-grid"><div className="recap-cell"><span className="recap-value">{formatTime(elapsed)}</span><span className="recap-label">TIME MOVING</span></div><div className="recap-cell"><span className="recap-value">{activeWorkout?.exercises.filter((exercise) => (loggedSets[exercise.id] ?? []).length >= exercise.sets).length ?? 0}</span><span className="recap-label">MOVEMENTS DONE</span></div><div className="recap-cell"><span className="recap-value">{Object.values(loggedSets).reduce((sum, sets) => sum + sets.length, 0)}</span><span className="recap-label">SETS LOGGED</span></div></div>
              <button className="primary-button" onClick={() => { setMode("dashboard"); setTab("train"); }}>Back to your day <ArrowRight size={15} /></button>
            </motion.section>
          </main>
        </motion.div>}
      </AnimatePresence>

      {editingDay && <SplitEditorModal day={editingDay} workout={split[editingDay]} onClose={() => setEditingDay(null)} onSave={saveWorkout} />}
      <AnimatePresence>{toast && <motion.div className="toast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}
