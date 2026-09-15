import { applyMapHighlights, regionsFromMuscles, toRegion, REGION_LABELS } from "./muscles.js";
import { equipmentIcon, equipmentLabel } from "./equipment.js";

const DATA_URL = "./exercises.json";
const gifUrl = (gif) => `./gifs/${gif}`;

function fixMojibake(str) {
  if (!str || typeof str !== "string") return str;
  let out = str
    .replace(/Ð²Â°/g, "°")
    .replace(/Ã‚Â°/g, "°")
    .replace(/Â°/g, "°")
    .replace(/в°/g, "°");
  if (/[ÂÐÃ]/.test(out)) {
    try {
      const bytes = Uint8Array.from(out, (ch) => ch.charCodeAt(0));
      out = new TextDecoder("utf-8").decode(bytes);
    } catch {
      /* keep partial fix */
    }
  }
  return out;
}

function sanitizeExercise(ex) {
  return {
    ...ex,
    name: fixMojibake(ex.name),
    instructions: (ex.instructions || []).map(fixMojibake),
  };
}

const state = {
  exercises: [],
  filtered: [],
  search: "",
  bodyParts: new Set(),
  equipment: new Set(),
  targetMuscles: new Set(),
  secondaryMuscles: new Set(),
  mapRegions: new Set(),
  exerciseId: null,
  enums: {
    bodyParts: [],
    equipment: [],
    targetMuscles: [],
    secondaryMuscles: [],
  },
  filterMapSvg: null,
  detailMapSvg: null,
  syncingUrl: false,
};

const els = {
  status: document.getElementById("status"),
  search: document.getElementById("search"),
  bodyParts: document.getElementById("body-parts"),
  equipment: document.getElementById("equipment"),
  targetMuscles: document.getElementById("target-muscles"),
  secondaryMuscles: document.getElementById("secondary-muscles"),
  filterMap: document.getElementById("filter-map"),
  clear: document.getElementById("clear-filters"),
  copyLink: document.getElementById("copy-link"),
  copyExerciseLink: document.getElementById("copy-exercise-link"),
  grid: document.getElementById("grid"),
  empty: document.getElementById("empty"),
  count: document.getElementById("result-count"),
  activeFilters: document.getElementById("active-filters"),
  modal: document.getElementById("exerciseModal"),
  modalTitle: document.getElementById("modal-title"),
  modalGif: document.getElementById("modal-gif"),
  modalTags: document.getElementById("modal-tags"),
  modalInstructions: document.getElementById("modal-instructions"),
  detailMap: document.getElementById("detail-map"),
  equipPrev: document.getElementById("equip-prev"),
  equipNext: document.getElementById("equip-next"),
  musclesBadge: document.querySelector('[data-count-for="muscles"]'),
};

let lazyObserver = null;
let bsModal = null;

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function deriveEnums(list) {
  return {
    bodyParts: uniqueSorted(list.flatMap((e) => e.bodyParts)),
    equipment: uniqueSorted(list.flatMap((e) => e.equipment)),
    targetMuscles: uniqueSorted(list.flatMap((e) => e.targetMuscles)),
    secondaryMuscles: uniqueSorted(list.flatMap((e) => e.secondaryMuscles)),
  };
}

function toggleInSet(set, value) {
  if (set.has(value)) set.delete(value);
  else set.add(value);
}

function parseParamsString(raw) {
  const cleaned = (raw || "").replace(/^#/, "").replace(/^\?/, "");
  return new URLSearchParams(cleaned);
}

function readParamsFromLocation() {
  if (location.hash && location.hash.length > 1) {
    return parseParamsString(location.hash.slice(1));
  }
  // Migrate legacy query-string permalinks into the hash once.
  if (location.search && location.search.length > 1) {
    return parseParamsString(location.search.slice(1));
  }
  return new URLSearchParams();
}

function multiFromParams(params, key) {
  return new Set(
    (params.get(key) || "")
      .split(",")
      .map((s) => decodeURIComponent(s.trim()))
      .filter(Boolean)
  );
}

function buildParamsFromState() {
  const params = new URLSearchParams();
  const put = (key, set) => {
    if (set.size) params.set(key, [...set].sort().join(","));
  };
  if (state.search) params.set("q", state.search);
  put("body", state.bodyParts);
  put("equip", state.equipment);
  put("target", state.targetMuscles);
  put("secondary", state.secondaryMuscles);
  put("map", state.mapRegions);
  if (state.exerciseId) params.set("ex", state.exerciseId);
  return params;
}

function parseUrlState() {
  const params = readParamsFromLocation();
  state.search = params.get("q") || "";
  state.bodyParts = multiFromParams(params, "body");
  state.equipment = multiFromParams(params, "equip");
  state.targetMuscles = multiFromParams(params, "target");
  state.secondaryMuscles = multiFromParams(params, "secondary");
  state.mapRegions = multiFromParams(params, "map");
  state.exerciseId = params.get("ex") || null;
  if (els.search) els.search.value = state.search;
}

function writeUrlState() {
  if (state.syncingUrl) return;
  const params = buildParamsFromState();
  const qs = params.toString();
  const next = qs ? `${location.pathname}#${qs}` : location.pathname;
  const current = `${location.pathname}${location.hash}`;
  if (next === current || (next === location.pathname && !location.hash && !location.search)) {
    // still clear legacy ?query if present
    if (location.search) history.replaceState(null, "", next);
    return;
  }
  history.replaceState(null, "", next);
}

function matchesFilters(ex, { skip = null } = {}) {
  if (skip !== "search" && state.search) {
    const q = state.search.toLowerCase();
    if (!ex.name.toLowerCase().includes(q)) return false;
  }
  if (skip !== "bodyParts" && state.bodyParts.size) {
    if (!ex.bodyParts.some((b) => state.bodyParts.has(b))) return false;
  }
  if (skip !== "equipment" && state.equipment.size) {
    if (!ex.equipment.some((e) => state.equipment.has(e))) return false;
  }
  if (skip !== "targetMuscles" && state.targetMuscles.size) {
    if (!ex.targetMuscles.some((m) => state.targetMuscles.has(m))) return false;
  }
  if (skip !== "secondaryMuscles" && state.secondaryMuscles.size) {
    if (!ex.secondaryMuscles.some((m) => state.secondaryMuscles.has(m))) return false;
  }
  if (skip !== "mapRegions" && state.mapRegions.size) {
    const regions = new Set([
      ...regionsFromMuscles(ex.targetMuscles),
      ...regionsFromMuscles(ex.secondaryMuscles),
    ]);
    let hit = false;
    for (const r of state.mapRegions) {
      if (regions.has(r)) {
        hit = true;
        break;
      }
    }
    if (!hit) return false;
  }
  return true;
}

function exerciseMatches(ex) {
  return matchesFilters(ex);
}

function availableForFacet(facet) {
  const available = new Set();
  for (const ex of state.exercises) {
    if (!matchesFilters(ex, { skip: facet })) continue;
    if (facet === "bodyParts") ex.bodyParts.forEach((v) => available.add(v));
    else if (facet === "equipment") ex.equipment.forEach((v) => available.add(v));
    else if (facet === "targetMuscles") ex.targetMuscles.forEach((v) => available.add(v));
    else if (facet === "secondaryMuscles") {
      ex.secondaryMuscles.forEach((v) => available.add(v));
    } else if (facet === "mapRegions") {
      for (const r of regionsFromMuscles(ex.targetMuscles)) available.add(r);
      for (const r of regionsFromMuscles(ex.secondaryMuscles)) available.add(r);
    }
  }
  return available;
}

function pruneSetToAvailable(set, available) {
  let changed = false;
  for (const value of [...set]) {
    if (!available.has(value)) {
      set.delete(value);
      changed = true;
    }
  }
  return changed;
}

function pruneIncompatibleSelections() {
  let changed = false;
  changed = pruneSetToAvailable(state.bodyParts, availableForFacet("bodyParts")) || changed;
  changed = pruneSetToAvailable(state.equipment, availableForFacet("equipment")) || changed;
  changed =
    pruneSetToAvailable(state.targetMuscles, availableForFacet("targetMuscles")) || changed;
  changed =
    pruneSetToAvailable(state.secondaryMuscles, availableForFacet("secondaryMuscles")) ||
    changed;
  changed = pruneSetToAvailable(state.mapRegions, availableForFacet("mapRegions")) || changed;
  return changed;
}

function setOptionAvailability(btn, enabled) {
  btn.classList.toggle("is-disabled", !enabled);
  btn.disabled = !enabled;
  btn.setAttribute("aria-disabled", enabled ? "false" : "true");
  if (!enabled) {
    btn.title = "No exercises match this option with your other filters";
  } else if (btn.classList.contains("equip-btn")) {
    btn.title = equipmentLabel(btn.dataset.value);
  } else {
    btn.title = btn.dataset.value || "";
  }
}

function updateOptionAvailability() {
  const bodyOk = availableForFacet("bodyParts");
  const equipOk = availableForFacet("equipment");
  const targetOk = availableForFacet("targetMuscles");
  const secondaryOk = availableForFacet("secondaryMuscles");
  const mapOk = availableForFacet("mapRegions");

  els.bodyParts.querySelectorAll(".chip").forEach((btn) => {
    const v = btn.dataset.value;
    setOptionAvailability(btn, bodyOk.has(v) || state.bodyParts.has(v));
  });
  els.equipment.querySelectorAll(".equip-btn").forEach((btn) => {
    const v = btn.dataset.value;
    const enabled = equipOk.has(v) || state.equipment.has(v);
    setOptionAvailability(btn, enabled);
    if (enabled) btn.title = equipmentLabel(v);
  });
  els.targetMuscles.querySelectorAll(".chip").forEach((btn) => {
    const v = btn.dataset.value;
    setOptionAvailability(btn, targetOk.has(v) || state.targetMuscles.has(v));
  });
  els.secondaryMuscles.querySelectorAll(".chip").forEach((btn) => {
    const v = btn.dataset.value;
    setOptionAvailability(btn, secondaryOk.has(v) || state.secondaryMuscles.has(v));
  });

  if (state.filterMapSvg) {
    state.filterMapSvg.querySelectorAll("[data-region]").forEach((el) => {
      const region = el.getAttribute("data-region");
      const enabled = mapOk.has(region) || state.mapRegions.has(region);
      el.classList.toggle("is-disabled", !enabled);
      el.style.pointerEvents = enabled ? "" : "none";
      el.setAttribute("aria-disabled", enabled ? "false" : "true");
    });
  }
}

function updateMusclesBadge() {
  const n =
    state.mapRegions.size + state.targetMuscles.size + state.secondaryMuscles.size;
  if (!els.musclesBadge) return;
  if (n > 0) {
    els.musclesBadge.hidden = false;
    els.musclesBadge.textContent = String(n);
  } else {
    els.musclesBadge.hidden = true;
    els.musclesBadge.textContent = "";
  }
}

function removeFilter(kind, value) {
  if (kind === "q") {
    state.search = "";
    els.search.value = "";
  } else if (kind === "body") state.bodyParts.delete(value);
  else if (kind === "equip") state.equipment.delete(value);
  else if (kind === "map") state.mapRegions.delete(value);
  else if (kind === "target") state.targetMuscles.delete(value);
  else if (kind === "secondary") state.secondaryMuscles.delete(value);
  applyFilters();
}

function updateActiveFilters() {
  const items = [];
  if (state.search) items.push({ kind: "q", value: state.search, label: `Search: ${state.search}` });
  for (const v of [...state.bodyParts].sort()) {
    items.push({ kind: "body", value: v, label: `Body: ${v}` });
  }
  for (const v of [...state.equipment].sort()) {
    items.push({ kind: "equip", value: v, label: `Equip: ${equipmentLabel(v)}` });
  }
  for (const v of [...state.mapRegions].sort()) {
    items.push({ kind: "map", value: v, label: `Map: ${REGION_LABELS[v] || v}` });
  }
  for (const v of [...state.targetMuscles].sort()) {
    items.push({ kind: "target", value: v, label: `Target: ${v}` });
  }
  for (const v of [...state.secondaryMuscles].sort()) {
    items.push({ kind: "secondary", value: v, label: `Secondary: ${v}` });
  }

  els.activeFilters.replaceChildren();
  if (!items.length) {
    els.activeFilters.hidden = true;
    return;
  }
  els.activeFilters.hidden = false;
  const label = document.createElement("span");
  label.className = "active-filters-label";
  label.textContent = "Active:";
  els.activeFilters.appendChild(label);

  for (const item of items) {
    const chip = document.createElement("span");
    chip.className = "active-chip";
    chip.append(document.createTextNode(item.label));
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "remove";
    btn.setAttribute("aria-label", `Remove ${item.label}`);
    btn.textContent = "×";
    btn.addEventListener("click", () => removeFilter(item.kind, item.value));
    chip.appendChild(btn);
    els.activeFilters.appendChild(chip);
  }
}

function applyFilters({ skipUrl = false } = {}) {
  pruneIncompatibleSelections();
  state.filtered = state.exercises.filter(exerciseMatches);
  if (!skipUrl) writeUrlState();
  updateFilterHighlights();
  updateOptionAvailability();
  updateMusclesBadge();
  updateActiveFilters();
  updateEquipNav();
  renderGrid();
}

function updateFilterHighlights() {
  applyMapHighlights(state.filterMapSvg, { selected: [...state.mapRegions] });
  els.bodyParts.querySelectorAll(".chip").forEach((btn) => {
    btn.classList.toggle("active", state.bodyParts.has(btn.dataset.value));
  });
  els.equipment.querySelectorAll(".equip-btn").forEach((btn) => {
    btn.classList.toggle("active", state.equipment.has(btn.dataset.value));
  });
  els.targetMuscles.querySelectorAll(".chip").forEach((btn) => {
    btn.classList.toggle("active", state.targetMuscles.has(btn.dataset.value));
  });
  els.secondaryMuscles.querySelectorAll(".chip").forEach((btn) => {
    btn.classList.toggle("active", state.secondaryMuscles.has(btn.dataset.value));
  });
}

function renderChipGroup(container, values, onToggle) {
  container.replaceChildren();
  for (const value of values) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-outline-secondary btn-sm chip rounded-pill";
    btn.dataset.value = value;
    btn.textContent = value;
    btn.addEventListener("click", () => {
      onToggle(value);
      applyFilters();
    });
    container.appendChild(btn);
  }
}

function renderEquipment() {
  els.equipment.replaceChildren();
  for (const value of state.enums.equipment) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-outline-secondary equip-btn";
    btn.dataset.value = value;
    btn.title = equipmentLabel(value);
    btn.innerHTML = `${equipmentIcon(value)}<span class="equip-label">${equipmentLabel(value)}</span>`;
    btn.addEventListener("click", () => {
      toggleInSet(state.equipment, value);
      applyFilters();
    });
    els.equipment.appendChild(btn);
  }
  updateEquipNav();
}

function updateEquipNav() {
  const scroller = els.equipment;
  if (!scroller) return;
  const max = scroller.scrollWidth - scroller.clientWidth;
  const left = scroller.scrollLeft;
  els.equipPrev.disabled = left <= 2;
  els.equipNext.disabled = left >= max - 2 || max <= 0;
}

function setupMaps(svgText) {
  els.filterMap.innerHTML = svgText;
  els.detailMap.innerHTML = svgText;
  state.filterMapSvg = els.filterMap.querySelector("svg");
  state.detailMapSvg = els.detailMap.querySelector("svg");

  state.filterMapSvg.querySelectorAll("[data-region]").forEach((el) => {
    el.addEventListener("click", () => {
      if (el.classList.contains("is-disabled")) return;
      const region = el.getAttribute("data-region");
      toggleInSet(state.mapRegions, region);
      applyFilters();
    });
  });
}

function stripStepPrefix(text) {
  return text.replace(/^Step:\s*\d+\s*/i, "").trim();
}

function renderGrid() {
  const list = state.filtered;
  els.count.textContent = `${list.length.toLocaleString()} exercise${list.length === 1 ? "" : "s"}`;
  els.empty.hidden = list.length > 0;
  els.grid.replaceChildren();

  if (lazyObserver) lazyObserver.disconnect();
  lazyObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const img = entry.target;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute("data-src");
        }
        lazyObserver.unobserve(img);
      }
    },
    { rootMargin: "200px" }
  );

  const frag = document.createDocumentFragment();
  for (const ex of list) {
    const col = document.createElement("div");
    col.className = "col";

    const card = document.createElement("article");
    card.className = "card h-100 exercise-card border-secondary";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.addEventListener("click", () => openModal(ex));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(ex);
      }
    });

    const media = document.createElement("div");
    media.className = "card-media";
    const img = document.createElement("img");
    img.className = "card-img-top";
    img.alt = ex.name;
    img.loading = "lazy";
    img.dataset.src = gifUrl(ex.gif);
    img.width = 300;
    img.height = 300;
    const ph = document.createElement("span");
    ph.className = "placeholder text-body-secondary small";
    ph.textContent = "GIF";
    media.append(ph, img);
    img.addEventListener("load", () => ph.remove(), { once: true });
    lazyObserver.observe(img);

    const body = document.createElement("div");
    body.className = "card-body p-2 p-sm-3";
    const title = document.createElement("h3");
    title.className = "card-title h6 mb-2";
    title.textContent = ex.name;
    const meta = document.createElement("div");
    meta.className = "d-flex flex-wrap gap-1";

    const equip = ex.equipment[0];
    const equipTag = document.createElement("span");
    equipTag.className = "badge text-bg-secondary tag fw-normal";
    equipTag.innerHTML = `${equipmentIcon(equip)} ${equipmentLabel(equip)}`;
    meta.appendChild(equipTag);

    for (const bp of ex.bodyParts) {
      const tag = document.createElement("span");
      tag.className = "badge text-bg-dark tag fw-normal";
      tag.textContent = bp;
      meta.appendChild(tag);
    }

    body.append(title, meta);
    card.append(media, body);
    col.appendChild(card);
    frag.appendChild(col);
  }
  els.grid.appendChild(frag);
}

function openModal(ex, { updateUrl = true } = {}) {
  state.exerciseId = ex.id;
  if (updateUrl) writeUrlState();

  els.modalTitle.textContent = ex.name;
  els.modalGif.src = gifUrl(ex.gif);
  els.modalGif.alt = ex.name;

  els.modalTags.replaceChildren();
  for (const eq of ex.equipment) {
    const tag = document.createElement("span");
    tag.className = "badge text-bg-secondary tag fw-normal";
    tag.innerHTML = `${equipmentIcon(eq)} ${equipmentLabel(eq)}`;
    els.modalTags.appendChild(tag);
  }
  for (const bp of ex.bodyParts) {
    const tag = document.createElement("span");
    tag.className = "badge text-bg-dark tag fw-normal";
    tag.textContent = `Region: ${bp}`;
    els.modalTags.appendChild(tag);
  }
  for (const m of ex.targetMuscles) {
    const tag = document.createElement("span");
    tag.className = "badge text-bg-danger tag fw-normal";
    tag.textContent = `Target: ${m}`;
    els.modalTags.appendChild(tag);
  }
  for (const m of ex.secondaryMuscles) {
    const tag = document.createElement("span");
    tag.className = "badge text-bg-warning text-dark tag fw-normal";
    tag.textContent = `Secondary: ${m}`;
    els.modalTags.appendChild(tag);
  }

  els.modalInstructions.replaceChildren();
  for (const step of ex.instructions) {
    const li = document.createElement("li");
    li.textContent = stripStepPrefix(step);
    els.modalInstructions.appendChild(li);
  }

  const primary = [...regionsFromMuscles(ex.targetMuscles)];
  const secondary = [...regionsFromMuscles(ex.secondaryMuscles)].filter(
    (r) => !primary.includes(r)
  );
  applyMapHighlights(state.detailMapSvg, { primary, secondary });

  bsModal?.show();
}

function clearFilters() {
  state.search = "";
  state.bodyParts.clear();
  state.equipment.clear();
  state.targetMuscles.clear();
  state.secondaryMuscles.clear();
  state.mapRegions.clear();
  state.exerciseId = null;
  els.search.value = "";
  applyFilters();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

function flashButton(btn, label = "Copied!") {
  const prev = btn.textContent;
  btn.textContent = label;
  setTimeout(() => {
    btn.textContent = prev;
  }, 1200);
}

function showStatus(msg, isError = false) {
  els.status.hidden = !msg;
  els.status.textContent = msg || "";
  els.status.className = `alert py-2 ${isError ? "alert-danger" : "alert-info"}`;
}

function openExerciseFromState() {
  if (!state.exerciseId) return;
  const ex = state.exercises.find((e) => e.id === state.exerciseId);
  if (ex) openModal(ex, { updateUrl: false });
}

function onHashChange() {
  state.syncingUrl = true;
  parseUrlState();
  state.syncingUrl = false;
  applyFilters({ skipUrl: true });
  if (state.exerciseId) openExerciseFromState();
  else bsModal?.hide();
}

async function init() {
  // Prefer hash; migrate ?query → #hash
  if (!location.hash && location.search) {
    history.replaceState(null, "", `${location.pathname}#${location.search.slice(1)}`);
  }

  parseUrlState();
  showStatus("Loading exercises…");
  bsModal = new bootstrap.Modal(els.modal);
  els.modal.addEventListener("hidden.bs.modal", () => {
    els.modalGif.removeAttribute("src");
    if (state.exerciseId) {
      state.exerciseId = null;
      writeUrlState();
    }
  });

  try {
    const [dataRes, mapRes] = await Promise.all([
      fetch(DATA_URL),
      fetch("./body-map.svg"),
    ]);
    if (!dataRes.ok) throw new Error(`Failed to load exercises.json (${dataRes.status})`);
    if (!mapRes.ok) throw new Error(`Failed to load body map (${mapRes.status})`);

    const raw = await dataRes.json();
    state.exercises = raw.map(sanitizeExercise);
    state.enums = deriveEnums(state.exercises);
    setupMaps(await mapRes.text());

    renderChipGroup(els.bodyParts, state.enums.bodyParts, (v) =>
      toggleInSet(state.bodyParts, v)
    );
    renderChipGroup(els.targetMuscles, state.enums.targetMuscles, (v) => {
      toggleInSet(state.targetMuscles, v);
      const region = toRegion(v);
      if (region && state.targetMuscles.has(v)) state.mapRegions.add(region);
    });
    renderChipGroup(els.secondaryMuscles, state.enums.secondaryMuscles, (v) =>
      toggleInSet(state.secondaryMuscles, v)
    );
    renderEquipment();

    els.search.addEventListener("input", () => {
      state.search = els.search.value.trim();
      applyFilters();
    });
    els.clear.addEventListener("click", clearFilters);
    els.copyLink.addEventListener("click", async () => {
      const url = `${location.origin}${location.pathname}${location.hash}`;
      if (await copyText(url)) flashButton(els.copyLink);
    });
    els.copyExerciseLink.addEventListener("click", async () => {
      const url = `${location.origin}${location.pathname}${location.hash}`;
      if (await copyText(url)) flashButton(els.copyExerciseLink);
    });

    els.equipPrev.addEventListener("click", () => {
      els.equipment.scrollBy({ left: -220, behavior: "smooth" });
    });
    els.equipNext.addEventListener("click", () => {
      els.equipment.scrollBy({ left: 220, behavior: "smooth" });
    });
    els.equipment.addEventListener("scroll", () => updateEquipNav(), { passive: true });
    window.addEventListener("resize", () => updateEquipNav());
    window.addEventListener("hashchange", onHashChange);

    showStatus("");
    applyFilters();
    openExerciseFromState();
  } catch (err) {
    console.error(err);
    showStatus(
      `${err.message}. Serve the repository root over HTTP (e.g. python -m http.server) and open /.`,
      true
    );
    els.count.textContent = "Failed to load";
  }
}

init();
