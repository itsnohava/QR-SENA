/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sena: {
          darkBg: '#050a09',     // Main page deep dark green-black background
          cardBg: '#0b1110',     // Form and panels dark card background
          textMuted: '#9aa0a6',  // Secondary text color
          green: '#39A900',      // Official SENA green
          neon: '#39ff14',       // Bright neon green accent for text/borders
          activeGlow: '#48c90f', // Vibrant green for buttons and active states
          inactiveBorder: '#1c2826', // Dark border for inputs/cards
        }
      },
      boxShadow: {
        'neon-border': '0 0 10px rgba(57, 255, 20, 0.4), inset 0 0 5px rgba(57, 255, 20, 0.2)',
        'neon-btn': '0 0 15px rgba(72, 201, 15, 0.5)',
        'panel-glow': '0 0 40px rgba(57, 169, 0, 0.15)',
        'card-shadow': '0 10px 30px rgba(0, 0, 0, 0.5)',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
