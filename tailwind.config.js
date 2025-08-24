/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm Beige/Brown Color System
        primary: {
          10: '#2F2520',
          20: '#453931',
          30: '#5C4D42',
          40: '#8B7355',
          50: '#A08968',
          60: '#B5A07B',
          70: '#CAB78F',
          80: '#DFCEA4',
          90: '#F0E6D0',
          95: '#F8F2E7',
          99: '#FAF9F7',
        },
        secondary: {
          10: '#2B251F',
          20: '#403932',
          30: '#564E45',
          40: '#6D6459',
          50: '#857B6E',
          60: '#9B8B7A',
          70: '#B5A695',
          80: '#D0C2B1',
          90: '#EBDDCC',
          95: '#F5EEE5',
          99: '#F0EDE9',
        },
        tertiary: {
          10: '#2A241E',
          20: '#3F3831',
          30: '#554E45',
          40: '#6C645A',
          50: '#847B70',
          60: '#9D9287',
          70: '#B8AE9F',
          80: '#D3CAB8',
          90: '#EFE6D2',
          95: '#F7F2E9',
          99: '#F2F0ED',
        },
        surface: {
          dim: '#5C4D42',
          DEFAULT: '#8B7355',
          bright: '#A08968',
          'container-lowest': '#2F2520',
          'container-low': '#453931',
          'container': '#5C4D42',
          'container-high': '#8B7355',
          'container-highest': '#A08968',
        },
        'surface-light': {
          dim: '#F8F2E7',
          DEFAULT: '#FAF9F7',
          bright: '#FAF9F7',
          'container-lowest': '#FFFFFF',
          'container-low': '#FAF9F7',
          'container': '#F5F3F0',
          'container-high': '#F0EDE9',
          'container-highest': '#EBDDCC',
        },
        // Beautiful Dark Mode Colors
        'surface-dark': {
          dim: '#0F0E0C',
          DEFAULT: '#1A1612',
          bright: '#2F2520',
          'container-lowest': '#0A0908',
          'container-low': '#0F0E0C',
          'container': '#1A1612',
          'container-high': '#2F2520',
          'container-highest': '#453931',
        },
        // Dark Mode Accent Colors
        'accent-dark': {
          gold: '#FFB000',      // Bright gold
          amber: '#FF8C00',     // Deep amber
          coral: '#FF6B35',     // Vibrant coral
          teal: '#20B2AA',      // Dark turquoise
          purple: '#9146FF',    // Rich purple
          emerald: '#10B981',   // Emerald green
        },
        // More distinctive warm priority colors
        priority: {
          high: '#C4704A',      // Rich burnt orange/terracotta
          medium: '#B8960F',    // Deep golden yellow
          low: '#4A7C59',       // Forest green
        },
        // Dark mode priority colors (more vibrant)
        'priority-dark': {
          high: '#FF6B35',      // Vibrant coral-orange
          medium: '#FFB000',    // Bright gold
          low: '#10B981',       // Emerald green
        },
        error: {
          10: '#3A2420',
          20: '#523530',
          30: '#6B4640',
          40: '#D4A084',
          50: '#DEB399',
          60: '#E8C5AE',
          70: '#F2D7C3',
          80: '#FCE9D8',
          90: '#FFF5ED',
          95: '#FFFAF6',
          99: '#FFFCFA',
        },
        'on-primary': '#FAF9F7',
        'on-secondary': '#FAF9F7', 
        'on-tertiary': '#FAF9F7',
        'on-surface': '#5C4D42',
        'on-surface-variant': '#6D6459',
        'on-error': '#FAF9F7',
        'outline': '#9B8B7A',
        'outline-variant': '#D0C2B1',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-large': ['3.5rem', { lineHeight: '4rem', letterSpacing: '-0.025em', fontWeight: '400' }],
        'display-medium': ['2.8125rem', { lineHeight: '3.25rem', letterSpacing: '0em', fontWeight: '400' }],
        'display-small': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '0em', fontWeight: '400' }],
        'headline-large': ['2rem', { lineHeight: '2.5rem', letterSpacing: '0em', fontWeight: '400' }],
        'headline-medium': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '0em', fontWeight: '400' }],
        'headline-small': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0em', fontWeight: '400' }],
        'title-large': ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '0em', fontWeight: '400' }],
        'title-medium': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.009375em', fontWeight: '500' }],
        'title-small': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.00625em', fontWeight: '500' }],
        'label-large': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.00625em', fontWeight: '500' }],
        'label-medium': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.03125em', fontWeight: '500' }],
        'label-small': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.03125em', fontWeight: '500' }],
        'body-large': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.009375em', fontWeight: '400' }],
        'body-medium': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.015625em', fontWeight: '400' }],
        'body-small': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em', fontWeight: '400' }],
      },
      borderRadius: {
        'none': '0',
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.75rem',
        '2xl': '2rem',
        'full': '9999px',
      },
      boxShadow: {
        'elevation-1': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
        'elevation-2': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
        'elevation-3': '0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
        'elevation-4': '0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
        'elevation-5': '0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'ripple': 'ripple 0.6s linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}