/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0284c7',
          hover: '#0369a1',
          glow: 'rgba(2, 132, 199, 0.15)',
        },
        secondary: {
          DEFAULT: '#0ea5e9',
          glow: 'rgba(14, 165, 233, 0.1)',
        },
        accent: '#4f46e5',
        'bg-main': '#f8fafc',
        'bg-secondary': '#f1f5f9',
        'border-color': '#e2e8f0',
        'text-main': '#0f172a',
        'text-muted': '#64748b',
        status: {
          pending: '#d97706',
          completed: '#16a34a',
          cancelled: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 4px 20px rgba(148, 163, 184, 0.08)',
        'glass-hover': '0 10px 30px rgba(148, 163, 184, 0.15)',
      }
    },
  },
  plugins: [],
}
