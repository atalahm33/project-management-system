/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A5F',
          50:  '#EBF0F7',
          100: '#C8D5E8',
          200: '#9FB9D5',
          300: '#749DC2',
          400: '#4F86B4',
          500: '#1E3A5F',
          600: '#193554',
          700: '#142B46',
          800: '#0F2138',
          900: '#0A1629',
        },
        navy: '#1E3A5F',
        success: '#2ECC71',
        warning: '#F39C12',
        danger:  '#E74C3C',
        info:    '#3498DB',
        surface: '#FFFFFF',
        background: '#F4F7FA',
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        sans:  ['Cairo', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        navy: '0 4px 24px 0 rgba(30,58,95,0.10)',
        'navy-lg': '0 8px 40px 0 rgba(30,58,95,0.15)',
        card: '0 2px 12px 0 rgba(30,58,95,0.08)',
      },
    },
  },
  plugins: [],
}
