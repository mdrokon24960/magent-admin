/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      { DEFAULT: '#0c0c1a', surface: '#111127', card: '#16162a', border: '#1e1e38' },
        primary: { DEFAULT: '#7c6ff7', hover: '#6b5ef0', muted: '#7c6ff71a' },
        accent:  { DEFAULT: '#38bdf8', muted: '#38bdf81a' },
        success: { DEFAULT: '#22c55e', muted: '#22c55e1a' },
        warning: { DEFAULT: '#f59e0b', muted: '#f59e0b1a' },
        danger:  { DEFAULT: '#ef4444', muted: '#ef44441a' },
        text:    { DEFAULT: '#e2e8f0', muted: '#64748b', subtle: '#334155' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card:  '0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)',
        glow:  '0 0 24px rgba(124,111,247,0.25)',
        input: '0 0 0 2px rgba(124,111,247,0.4)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7c6ff7, #38bdf8)',
        'gradient-card':    'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      },
    },
  },
  plugins: [],
}
