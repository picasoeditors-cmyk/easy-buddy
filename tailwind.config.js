/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        coral: {
          50: '#fff4f1',
          100: '#ffe6df',
          200: '#ffcabd',
          300: '#ffa58f',
          400: '#ff8466',
          500: '#f9694a',
          600: '#e24e30',
        },
        ink: '#0f172a',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,.04), 0 8px 30px -12px rgba(15,23,42,.14)',
        glow: '0 0 0 1px rgba(99,102,241,.15), 0 10px 40px -10px rgba(99,102,241,.45)',
      },
      keyframes: {
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
      },
    },
  },
  plugins: [],
}
