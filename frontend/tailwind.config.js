/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: '#F8FAFC',
        panel: '#FFFFFF',
        panelEdge: '#E2E8F0',
        neonGreen: '#059669',
        neonCyan: '#0284C7',
        neonMagenta: '#E11D48',
        textMain: '#0F172A',
        textMuted: '#64748B',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'neon-green': '0 4px 16px rgba(5, 150, 105, 0.18)',
        'neon-cyan': '0 4px 16px rgba(2, 132, 199, 0.18)',
        'neon-magenta': '0 4px 16px rgba(225, 29, 72, 0.18)',
        panel: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      },
      keyframes: { 'pulse-glow': { '0%,100%': { opacity: 0.6 }, '50%': { opacity: 1 } } },
      animation: { 'pulse-glow': 'pulse-glow 2s ease-in-out infinite' },
    },
  },
  plugins: [],
}
