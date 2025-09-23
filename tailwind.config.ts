import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "bg-blue-500",
    "hover:bg-blue-600",
    "bg-green-500",
    "hover:bg-green-600",
    "bg-purple-500",
    "hover:bg-purple-600",
    "bg-red-500",
    "hover:bg-red-600",
    "bg-orange-500",
    "hover:bg-orange-600",
    "bg-pink-500",
    "hover:bg-pink-600",
    "bg-yellow-500",
    "hover:bg-yellow-600",
    "bg-teal-500",
    "hover:bg-teal-600",
    "bg-indigo-500",
    "hover:bg-indigo-600",
    "bg-gray-500",
    "hover:bg-gray-600",
    "bg-red-700",
    "hover:bg-red-800",
    "bg-green-600",
    "hover:bg-green-700",
    "bg-blue-100",
    "text-blue-800",
    "border-blue-200",
    "bg-red-100",
    "text-red-800",
    "border-red-200",
    "bg-yellow-100",
    "text-yellow-800",
    "border-yellow-200",
    "bg-green-100",
    "text-green-800",
    "border-green-200",
    "bg-orange-600",
    "hover:bg-orange-700",
  ],
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
        body: ["PT Sans", "sans-serif"],
        headline: ["Playfair Display", "serif"],
        code: ["monospace"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          border: "hsl(var(--card-border))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--primary))",
          "2": "hsl(var(--accent))",
          "3": "hsl(var(--secondary-foreground))",
          "4": "hsl(220 70% 60%)",
          "5": "hsl(340 80% 60%)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        "2xl": "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "glow-accent":
          "0 10px 20px -5px hsl(var(--accent) / 0.1), 0 4px 6px -2px hsl(var(--accent) / 0.05)",
        "glow-sidebar":
          "0 0 15px -3px hsl(var(--sidebar-accent) / 0.2), 0 4px 6px -4px hsl(var(--sidebar-accent) / 0.1)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "collapsible-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-collapsible-content-height)",
          },
        },
        "collapsible-up": {
          from: {
            height: "var(--radix-collapsible-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
