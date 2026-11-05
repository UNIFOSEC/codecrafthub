import { readString, writeString } from "../data/storage";
import { h } from "./dom";
import { icon, type IconName } from "./icons";

type Theme = "system" | "light" | "dark";
const KEY = "cch.theme"; // also read by public/theme-init.js before first paint
const ORDER: Theme[] = ["system", "light", "dark"];
const META: Record<Theme, { label: string; icon: IconName }> = {
  system: { label: "System theme", icon: "monitor" },
  light: { label: "Light theme", icon: "sun" },
  dark: { label: "Dark theme", icon: "moon" },
};

function current(): Theme {
  const saved = readString(KEY);
  return saved === "light" || saved === "dark" ? saved : "system";
}

function apply(theme: Theme): void {
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

/** Button that cycles System → Light → Dark. */
export function themeToggle(): HTMLButtonElement {
  let theme = current();
  apply(theme);

  const btn = h("button", {
    class: "sidebar-btn",
    attrs: { type: "button" },
    on: {
      click: () => {
        theme = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
        writeString(KEY, theme === "system" ? null : theme);
        apply(theme);
        render();
      },
    },
  });

  function render() {
    const { label, icon: iconName } = META[theme];
    btn.replaceChildren(icon(iconName, 18), h("span", { class: "label" }, label));
    btn.setAttribute("aria-label", `${label}. Click to change.`);
    btn.title = label;
  }

  render();
  return btn;
}
