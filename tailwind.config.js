module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      // Map the locked design tokens to real Tailwind utilities so components
      // stop reaching for raw palette values (the drift source). CSS variables
      // remain the source of truth in app/globals.css.
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      colors: {
        navy: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          hover: 'var(--gold-hover)',
          text: 'var(--gold-text)',
        },
        lean: {
          left: 'var(--lean-left)',
          center: 'var(--lean-center)',
          right: 'var(--lean-right)',
        },
      },
    }
  },
  plugins: [],
}
