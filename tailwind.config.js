/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f7f6f2",
        surface: "#ffffff",
        border: "#e8e5de",
        // food state colors (唯一语义：仅用于食物状态)
        "food-removed": "#9b2226",
        "food-removed-note": "#AF4E51",
        "food-primary": "#1a5fa8",
        "food-primary-note": "#487fb9",
        "food-aux": "#2d6a4f",
        "food-aux-note": "#578872",
        "food-merge-up": "#92560a",
        "food-merge-up-note": "#A8783B",
        "food-merge-down": "#6a3b9b",
        "food-merge-down-note": "#8862AF",

        // neutral UI accents (避免复用上面 5 个语义色)
        ui: "#0f172a",
        "ui-hover": "#1f2937",
        "ui-soft": "#eef2f7",
        "ui-border": "#d0ccc2",
      },
    },
  },
  plugins: [],
};
