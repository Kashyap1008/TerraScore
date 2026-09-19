/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: '#050505', panel: '#0F0F0F', panelEdge: '#1A1A1A',
        neonGreen: '#CCFF00', neonCyan: '#00E5FF', neonMagenta: '#FF00FF',
        textMain: '#FFFFFF', textMuted: '#8892B0',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(204,255,0,0.15)',
        'neon-cyan': '0 0 20px rgba(0,229,255,0.15)',
        'neon-magenta': '0 0 20px rgba(255,0,255,0.15)',
      },
      keyframes: { 'pulse-glow': { '0%,100%': { opacity: 0.6 }, '50%': { opacity: 1 } } },
      animation: { 'pulse-glow': 'pulse-glow 2s ease-in-out infinite' },
    },
  },
  plugins: [],
}
