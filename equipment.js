/** Equipment display labels and inline SVG icons (24×24 viewBox). */

const icon = (paths) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const EQUIPMENT_META = {
  assisted: {
    label: "Assisted",
    icon: icon(
      `<circle cx="12" cy="5" r="2"/><path d="M8 22v-6l-2-4 2-3h8l2 3-2 4v6"/><path d="M6 12h12"/>`
    ),
  },
  band: {
    label: "Band",
    icon: icon(`<path d="M4 8c4-4 12-4 16 0M4 16c4 4 12 4 16 0"/><path d="M4 8v8M20 8v8"/>`),
  },
  barbell: {
    label: "Barbell",
    icon: icon(
      `<path d="M3 12h18"/><rect x="1" y="9" width="3" height="6" rx="0.5"/><rect x="20" y="9" width="3" height="6" rx="0.5"/><rect x="5" y="10" width="2" height="4"/><rect x="17" y="10" width="2" height="4"/>`
    ),
  },
  "body weight": {
    label: "Body weight",
    icon: icon(
      `<circle cx="12" cy="5" r="2.2"/><path d="M12 8v6M9 22l3-8 3 8M7 12h10"/>`
    ),
  },
  "bosu ball": {
    label: "Bosu ball",
    icon: icon(`<path d="M4 16a8 8 0 0 1 16 0z"/><path d="M4 16h16"/>`),
  },
  cable: {
    label: "Cable",
    icon: icon(
      `<rect x="3" y="3" width="4" height="18" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/><path d="M7 8h10M7 16h10"/><circle cx="12" cy="8" r="1.5"/><circle cx="12" cy="16" r="1.5"/>`
    ),
  },
  dumbbell: {
    label: "Dumbbell",
    icon: icon(
      `<path d="M6 12h12"/><rect x="2" y="8" width="4" height="8" rx="1"/><rect x="18" y="8" width="4" height="8" rx="1"/><rect x="6" y="10" width="2" height="4"/><rect x="16" y="10" width="2" height="4"/>`
    ),
  },
  "elliptical machine": {
    label: "Elliptical",
    icon: icon(
      `<ellipse cx="12" cy="16" rx="8" ry="3"/><path d="M8 16V8l4-3 4 3v8"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/>`
    ),
  },
  "ez barbell": {
    label: "EZ barbell",
    icon: icon(
      `<path d="M2 12h3c1 0 2-2 3-2s2 2 3 2 2-2 3-2 2 2 3 2h3"/><rect x="1" y="9" width="2.5" height="6" rx="0.4"/><rect x="20.5" y="9" width="2.5" height="6" rx="0.4"/>`
    ),
  },
  hammer: {
    label: "Hammer",
    icon: icon(
      `<path d="M12 10v11"/><rect x="7" y="3" width="10" height="7" rx="1"/><path d="M10 21h4"/>`
    ),
  },
  "leverage machine": {
    label: "Leverage machine",
    icon: icon(
      `<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 16V9l4-2 4 2v7"/><path d="M8 12h8"/>`
    ),
  },
  "medicine ball": {
    label: "Medicine ball",
    icon: icon(
      `<circle cx="12" cy="12" r="8"/><path d="M4.5 12h15M12 4.5v15M7 7c3 3 7 3 10 0M7 17c3-3 7-3 10 0"/>`
    ),
  },
  "olympic barbell": {
    label: "Olympic barbell",
    icon: icon(
      `<path d="M1 12h22"/><rect x="0.5" y="8" width="3" height="8" rx="0.5"/><rect x="20.5" y="8" width="3" height="8" rx="0.5"/><rect x="4" y="9.5" width="2" height="5"/><rect x="18" y="9.5" width="2" height="5"/>`
    ),
  },
  "resistance band": {
    label: "Resistance band",
    icon: icon(
      `<path d="M5 7c0-1.5 1-2.5 2.5-2.5S10 5.5 10 7v10c0 1.5-1 2.5-2.5 2.5S5 18.5 5 17V7z"/><path d="M14 7c0-1.5 1-2.5 2.5-2.5S19 5.5 19 7v10c0 1.5-1 2.5-2.5 2.5S14 18.5 14 17V7z"/><path d="M10 12h4"/>`
    ),
  },
  roller: {
    label: "Roller",
    icon: icon(
      `<rect x="3" y="9" width="18" height="6" rx="3"/><path d="M7 9v6M12 9v6M17 9v6"/>`
    ),
  },
  rope: {
    label: "Rope",
    icon: icon(
      `<path d="M8 4c0 4 8 4 8 8s-8 4-8 8"/><path d="M12 4v1M12 19v1"/><circle cx="12" cy="3" r="1"/><circle cx="12" cy="21" r="1"/>`
    ),
  },
  "skierg machine": {
    label: "SkiErg",
    icon: icon(
      `<path d="M12 3v10"/><path d="M8 6l4-3 4 3"/><path d="M7 21l5-8 5 8"/><path d="M9 14h6"/>`
    ),
  },
  "sled machine": {
    label: "Sled",
    icon: icon(
      `<path d="M4 16h14l2-6H8l-4 6z"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/><path d="M6 10V7h4"/>`
    ),
  },
  "smith machine": {
    label: "Smith machine",
    icon: icon(
      `<path d="M5 3v18M19 3v18"/><path d="M5 6h14M5 18h14"/><path d="M7 12h10"/><rect x="9" y="10" width="6" height="4" rx="0.5"/>`
    ),
  },
  "stability ball": {
    label: "Stability ball",
    icon: icon(
      `<circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="3.5" ry="8"/><path d="M4.5 12h15"/>`
    ),
  },
  "stationary bike": {
    label: "Stationary bike",
    icon: icon(
      `<circle cx="7" cy="17" r="3.5"/><circle cx="17" cy="17" r="3.5"/><path d="M7 17l4-8h4l2 4"/><path d="M11 9V6h3"/>`
    ),
  },
  "stepmill machine": {
    label: "Stepmill",
    icon: icon(
      `<path d="M4 20h4v-4h4v-4h4V8h4"/><path d="M4 20V8"/>`
    ),
  },
  tire: {
    label: "Tire",
    icon: icon(
      `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20"/>`
    ),
  },
  "trap bar": {
    label: "Trap bar",
    icon: icon(
      `<rect x="6" y="7" width="12" height="10" rx="1"/><path d="M2 12h4M18 12h4"/><rect x="1" y="9" width="2.5" height="6" rx="0.4"/><rect x="20.5" y="9" width="2.5" height="6" rx="0.4"/>`
    ),
  },
  weighted: {
    label: "Weighted",
    icon: icon(
      `<rect x="6" y="8" width="12" height="10" rx="1"/><path d="M9 8V6h6v2"/><path d="M10 13h4"/>`
    ),
  },
  "wheel roller": {
    label: "Wheel roller",
    icon: icon(
      `<circle cx="12" cy="13" r="6"/><path d="M6 13h12"/><path d="M9 5h6"/><path d="M12 5v2"/>`
    ),
  },
};

export function equipmentLabel(key) {
  return EQUIPMENT_META[key]?.label ?? key;
}

export function equipmentIcon(key) {
  return EQUIPMENT_META[key]?.icon ?? icon(`<circle cx="12" cy="12" r="7"/>`);
}
