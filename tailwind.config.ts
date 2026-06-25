import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Daylight design system
        'ws-green':       '#15A05A', // primary action
        'ws-green-deep':  '#0E7A43', // headings, dark panels
        'ws-dark-green':  '#0E7A43', // alias
        'ws-green-tint':  '#EAF5EE', // surfaces, pills
        'ws-green-tint2': '#F2F6F3', // lighter tint
        'ws-subtle':      '#9AA39D', // very muted
        'ws-bg':          '#E7EAE7', // page background
        'ws-card':        '#FFFFFF', // card background
        'ws-border':      '#E4EAE6', // card borders
        'ws-ink':         '#15201B', // near-black text
        'ws-body':        '#3D463F', // body text
        'ws-muted':       '#7C887F', // muted text
        'ws-amber-bg':    '#FBF7EC', // warning surface
        'ws-amber-border':'#EAD9A8', // warning border
        'ws-amber-text':  '#8A6B1F', // warning text
        'ws-red-text':    '#B23A2E', // error text
        'ws-red-bg':      '#FBEEEC', // error surface
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'sans-serif'],
        body:    ['Figtree', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', '1.4'],
      },
      borderRadius: {
        'tile': '14px',
        'card': '16px',
        'card-lg': '20px',
        'pill': '20px',
        'btn':  '12px',
      },
      boxShadow: {
        'float': '0 16px 40px rgba(20,60,40,0.10)',
      },
      maxWidth: {
        content: '680px',
      },
    },
  },
  plugins: [],
}

export default config
