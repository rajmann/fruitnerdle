import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'nerdle-purple': '#820458',
        'nerdle-purple-dark': '#6c0349',
        'nerdle-teal': '#398874',
        'nerdle-teal-dark': '#256554',
        'nerdle-purple-light': '#f0d6e5',
        'nerdle-teal-light': '#e9f6f2',
        'fruit-red': '#D64045',
        'fruit-orange': '#E8993A',
        'fruit-yellow': '#F5D547',
        'fruit-green': '#5B8C3E',
        'fruit-cream': '#FFF8E7',
        'fruit-brown': '#8B6914',
        'machine-body': '#1a0a2a',
        'machine-panel': '#2a1540',
        'chrome-light': '#747880',
        'chrome-mid': '#686c74',
        'chrome-dark': '#505460',
        'led-green': '#00ff88',
        'led-amber': '#ffcc00',
      },
      fontFamily: {
        title: ['Quicksand', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
      },
      keyframes: {
        'fruit-fall': {
          '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(110vh) rotate(720deg)', opacity: '0' },
        },
        'bounce-settle': {
          '0%': { transform: 'translateY(-8px)' },
          '40%': { transform: 'translateY(4px)' },
          '70%': { transform: 'translateY(-2px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(57, 136, 116, 0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(57, 136, 116, 0.5)' },
        },
        'bulb-chase': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fruit-fall': 'fruit-fall 3s ease-in forwards',
        'bounce-settle': 'bounce-settle 0.4s ease-out',
        'pulse-green': 'pulse-green 0.6s ease-in-out 3',
        'bulb-chase': 'bulb-chase 1s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
