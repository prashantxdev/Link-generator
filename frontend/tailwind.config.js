module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#10b981",
          DEFAULT: "#059669",
          dark: "#047857",
        },
        dark: {
          bg: "#0f172a",
          surface: "#1e293b",
          border: "#334155",
        },
      },
      backgroundColor: {
        dark: "#0f172a",
        "dark-surface": "#1e293b",
      },
    },
  },
  plugins: [],
};
