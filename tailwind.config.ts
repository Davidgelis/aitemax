
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        balgin: ['Balgin', 'sans-serif'],
      },
      height: {
        '120': '30rem', // 3x of h-40 (10rem)
        '144': '36rem', // 3x of h-48 (12rem)
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#33fea6",
          dark: "#084b49",
          light: "#64bf95",
        },
        text: {
          DEFAULT: "#545454",
        },
        accent: {
          DEFAULT: "#041524",
        },
        green: {
          300: "#4ade80", // Light green color
          400: "#22c55e", // Medium green color that matches the image
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" }
        },
        "aurora": {
          "0%": {
            backgroundPosition: "0% 50%"
          },
          "50%": {
            backgroundPosition: "100% 50%"
          },
          "100%": {
            backgroundPosition: "0% 50%"
          }
        }
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out",
        "slide-in": "slide-in 0.6s ease-out",
        "aurora": "aurora 8s ease infinite"
      },
      backgroundImage: {
        'aurora-gradient': "linear-gradient(-45deg, #041524, #084b49, #33fea6, #64bf95, white)",
      },
      backgroundSize: {
        'aurora': "400% 400%",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
