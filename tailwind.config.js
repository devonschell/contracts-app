/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB", // blue-600
          light: "#60A5FA",
          dark: "#1E40AF"
        },
        accent: {
          DEFAULT: "#6366F1", // indigo-500
          light: "#A78BFA",
        },
        background: "#F8FAFC",
        surface: "#FFFFFF",
        text: {
          primary: "#1E293B",
          secondary: "#475569"
        },
        border: "#E2E8F0",
        success: "#22C55E",
        info: "#0EA5E9"
      }
    }
  },
  plugins: [],
};
