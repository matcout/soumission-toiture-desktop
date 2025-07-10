/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleur principale de la toiture (seule couleur custom nécessaire)
        'toiture': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#2dbe60', // Votre vert principal
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        }
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
  // Assurer que toutes les classes sont générées
  safelist: [
    // Classes de toiture
    'bg-toiture-50', 'bg-toiture-100', 'bg-toiture-500', 'bg-toiture-600',
    'text-toiture-500', 'text-toiture-600', 'text-toiture-700',
    'border-toiture-200', 'border-toiture-500',
    // Classes d'animations
    'animate-fadeIn'
  ]
}