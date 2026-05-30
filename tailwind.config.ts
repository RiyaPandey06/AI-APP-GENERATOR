import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        mint: "#dff6ec",
        leaf: "#2d6a4f",
        coral: "#f26d5b",
        gold: "#f5bd4f",
        cloud: "#f7f8f6"
      }
    }
  },
  plugins: []
};

export default config;
