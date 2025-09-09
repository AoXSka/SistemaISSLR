/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      // Enterprise Color System
      colors: {
        // Primary - Azul Corporativo Moderno
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        
        // Accent - Púrpura Premium
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },

        // Venezuelan Corporate Colors
        venezuela: {
          red: '#dc2626',
          yellow: '#fbbf24',
          blue: '#1e40af',
        },

        // Neutral - Slate System (Más Premium que Gray)
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },

        // Semantic Colors - Internacional Standards
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },

      // Typography Enterprise
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },

      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.25', fontWeight: '500' }],
        'sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'base': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'lg': ['1.125rem', { lineHeight: '1.5', fontWeight: '500' }],
        'xl': ['1.25rem', { lineHeight: '1.25', fontWeight: '600' }],
        '2xl': ['1.5rem', { lineHeight: '1.25', fontWeight: '700' }],
        '3xl': ['1.875rem', { lineHeight: '1.25', fontWeight: '700' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', fontWeight: '800' }],
        '5xl': ['3rem', { lineHeight: '1.1', fontWeight: '800' }],
      },

      // Spacing System 8px Base
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },

      // Border Radius Enterprise
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      // Shadow System Enterprise
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'DEFAULT': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'premium': '0 32px 64px -12px rgba(37, 99, 235, 0.15)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glow-primary': '0 0 20px rgba(37, 99, 235, 0.3)',
        'glow-accent': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
      },

      // Backdrop Blur
      backdropBlur: {
        'xs': '2px',
        'xl': '20px',
      },

      // Animation System
      animation: {
        'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounceGentle 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
      },

      keyframes: {
        slideUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(24px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideDown: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-24px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        scaleIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.9)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceGentle: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.3)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.05)',
          },
          '70%': {
            transform: 'scale(0.9)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-200px 0'
          },
          '100%': {
            backgroundPosition: 'calc(200px + 100%) 0'
          }
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },

      // Transition Timing Functions
      transitionTimingFunction: {
        'bounce-gentle': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'enterprise': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // Z-index Scale
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Glass Effects
        '.glass-card': {
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: theme('boxShadow.glass'),
        },
        '[data-theme="dark"] .glass-card': {
          background: 'rgba(11, 20, 38, 0.85)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: theme('boxShadow.glass-dark'),
          color: '#ffffff'
        },
        
        // Venezuelan Flag Utilities
        '.bg-venezuela-gradient': {
          background: `linear-gradient(135deg, ${theme('colors.venezuela.yellow')} 0%, ${theme('colors.venezuela.red')} 50%, ${theme('colors.venezuela.blue')} 100%)`,
        },
        
        // Enterprise Gradients
        '.bg-enterprise-primary': {
          background: `linear-gradient(135deg, ${theme('colors.primary.600')}, ${theme('colors.primary.700')})`,
        },
        '.bg-enterprise-accent': {
          background: `linear-gradient(135deg, ${theme('colors.accent.500')}, ${theme('colors.accent.600')})`,
        },
        
        // Text Utilities
        '.text-gradient-primary': {
          background: `linear-gradient(135deg, ${theme('colors.primary.600')}, ${theme('colors.accent.600')})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        
        // Dark Mode Form Labels
        '[data-theme="dark"] label': {
          color: '#ffffff !important',
          fontWeight: '600 !important'
        },
        
        '[data-theme="dark"] .form-label': {
          color: '#f1f5f9 !important'
        },
        
        // Dark Mode Input States
        '[data-theme="dark"] input': {
          backgroundColor: '#1e293b',
          borderColor: '#64748b',
          color: '#ffffff'
        },
        
        '[data-theme="dark"] input:focus': {
          borderColor: theme('colors.primary.400'),
          backgroundColor: '#334155',
          boxShadow: `0 0 0 3px ${theme('colors.primary.400')}33`
        },
        
        '[data-theme="dark"] select': {
          backgroundColor: '#1e293b',
          borderColor: '#64748b',
          color: '#ffffff'
        },
        
        '[data-theme="dark"] textarea': {
          backgroundColor: '#1e293b',
          borderColor: '#64748b',
          color: '#ffffff'
        },
        
        // Scrollbar Styling
        '.scrollbar-enterprise': {
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme('colors.primary.400')} ${theme('colors.neutral.200')}`,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme('colors.neutral.200'),
            borderRadius: theme('borderRadius.full'),
          },
          '&::-webkit-scrollbar-thumb': {
            background: `linear-gradient(135deg, ${theme('colors.primary.400')}, ${theme('colors.accent.400')})`,
            borderRadius: theme('borderRadius.full'),
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: `linear-gradient(135deg, ${theme('colors.primary.500')}, ${theme('colors.accent.500')})`,
          },
        },
      };
      
      addUtilities(newUtilities);
    },
  ],
};