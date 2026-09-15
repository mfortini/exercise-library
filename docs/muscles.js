/**
 * Muscle alias → body-map region IDs, plus helpers for filter/detail highlighting.
 */
export const REGION_LABELS = {
  neck: "Neck",
  shoulders: "Shoulders",
  chest: "Chest",
  serratus: "Serratus",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  abs: "Abs",
  obliques: "Obliques",
  quads: "Quads",
  adductors: "Adductors",
  abductors: "Abductors",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  traps: "Traps",
  lats: "Lats",
  upper_back: "Upper back",
  lower_back: "Lower back",
  spine: "Spine",
  cardio: "Cardio",
};

/** Map any dataset muscle string to a region id (or null if unmapped). */
const ALIASES = {
  // chest
  pectorals: "chest",
  chest: "chest",
  "upper chest": "chest",
  // shoulders
  delts: "shoulders",
  shoulders: "shoulders",
  deltoids: "shoulders",
  "rear deltoids": "shoulders",
  "rotator cuff": "shoulders",
  // arms
  biceps: "biceps",
  brachialis: "biceps",
  triceps: "triceps",
  forearms: "forearms",
  "wrist flexors": "forearms",
  "wrist extensors": "forearms",
  // core / abs
  abs: "abs",
  abdominals: "abs",
  core: "abs",
  obliques: "obliques",
  "hip flexors": "abs",
  // legs
  quads: "quads",
  quadriceps: "quads",
  hamstrings: "hamstrings",
  glutes: "glutes",
  calves: "calves",
  soleus: "calves",
  shins: "calves",
  adductors: "adductors",
  abductors: "abductors",
  groin: "adductors",
  // back
  traps: "traps",
  trapezius: "traps",
  lats: "lats",
  "latissimus dorsi": "lats",
  "upper back": "upper_back",
  back: "upper_back",
  rhomboids: "upper_back",
  "lower back": "lower_back",
  spine: "spine",
  // neck
  "levator scapulae": "neck",
  sternocleidomastoid: "neck",
  // other
  "serratus anterior": "serratus",
  "cardiovascular system": "cardio",
};

export function toRegion(muscle) {
  if (!muscle) return null;
  return ALIASES[muscle.toLowerCase()] ?? null;
}

export function regionsFromMuscles(muscles) {
  const set = new Set();
  for (const m of muscles || []) {
    const r = toRegion(m);
    if (r) set.add(r);
  }
  return set;
}

/** Muscles in the dataset that map to a given region (for filtering). */
export function musclesMatchingRegion(region, allMuscles) {
  return allMuscles.filter((m) => toRegion(m) === region);
}

export function applyMapHighlights(root, { selected = [], primary = [], secondary = [] } = {}) {
  if (!root) return;
  root.querySelectorAll("[data-region]").forEach((el) => {
    el.classList.remove("is-selected", "is-primary", "is-secondary");
  });
  const mark = (list, cls) => {
    for (const region of list) {
      root.querySelectorAll(`[data-region="${region}"]`).forEach((el) => {
        el.classList.add(cls);
      });
    }
  };
  mark(selected, "is-selected");
  mark(primary, "is-primary");
  mark(secondary, "is-secondary");
}
