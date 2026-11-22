/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#f5f7fb',
          100: '#e9edf5',
          200: '#d3dae8',
          300: '#a9b4cc',
          400: '#7584a6',
          500: '#4f5f83',
          600: '#3a4868',
          700: '#2a3654',
          800: '#1b2540',
          900: '#0f172e',
          950: '#090f1f',
        },
        brand: {
          50: '#f3f1ff',
          100: '#e9e5ff',
          200: '#d5ceff',
          300: '#b6a8ff',
          400: '#9479ff',
          500: '#7650fb',
          600: '#6634ef',
          700: '#5525d4',
          800: '#461fac',
          900: '#3b1d8a',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,46,0.04), 0 4px 16px -4px rgba(15,23,46,0.06)',
        lift: '0 2px 4px rgba(15,23,46,0.04), 0 12px 32px -8px rgba(15,23,46,0.12)',
        glow: '0 8px 30px -6px rgba(102,52,239,0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6634ef 0%, #4f6bff 55%, #2f8cff 100%)',
        'brand-soft': 'linear-gradient(135deg, #f3f1ff 0%, #eef3ff 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
