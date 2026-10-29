/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        tactical: {
          950: '#0a0d12',
          900: '#111620',
          850: '#161c28',
          800: '#1c2434',
          700: '#2a364d',
          accent: '#e69b00',
          critical: '#ef4444',
          safe: '#10b981',
          cyan: '#06b6d4',
        }
      }
    },
  },
  plugins: [],
}
