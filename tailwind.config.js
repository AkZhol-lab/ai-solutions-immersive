/** Design tokens live in src/style.css (:root). Tailwind only references them. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.ts'],
  theme: {
    screens: { sm: '480px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1440px' },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      bg: 'var(--c-bg)',
      fg: 'var(--c-fg)',
      muted: 'var(--c-muted)',
      line: 'var(--c-line)',
      violet: 'var(--c-accent-a)',
      cyan: 'var(--c-accent-b)',
    },
    fontFamily: {
      display: 'var(--font-display)',
      sans: 'var(--font-text)',
    },
    spacing: {
      0: '0',
      px: '1px',
      1: 'var(--s-1)', // 4
      2: 'var(--s-2)', // 8
      4: 'var(--s-4)', // 16
      6: 'var(--s-6)', // 24
      10: 'var(--s-10)', // 40
      16: 'var(--s-16)', // 64
      30: 'var(--s-30)', // 120
      gutter: 'var(--gutter)',
    },
    borderRadius: { none: '0', DEFAULT: 'var(--radius)', full: '9999px' },
    maxWidth: { container: 'var(--container)', prose: '34rem', none: 'none' },
    extend: {
      fontSize: {
        display: [
          'var(--fs-display)',
          { lineHeight: 'var(--lh-display)', letterSpacing: 'var(--ls-display)' },
        ],
        h2: [
          'var(--fs-h2)',
          { lineHeight: 'var(--lh-display)', letterSpacing: 'var(--ls-display)' },
        ],
        body: ['var(--fs-body)', { lineHeight: 'var(--lh-text)' }],
        small: ['var(--fs-small)', { lineHeight: '1.5' }],
      },
      backgroundImage: { accent: 'var(--accent)' },
      borderColor: { DEFAULT: 'var(--c-line)' },
      minHeight: { screen: '100svh' },
    },
  },
  plugins: [],
};
