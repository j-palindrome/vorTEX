import type { Config } from 'tailwindcss'

export default {
  content: ['src/**/*.{tsx,css}', 'index.html'],
  theme: {
    fontFamily: {
      sans: 'Andale Mono',
      mono: 'Andale Mono'
    },
    extend: {}
  },
  plugins: []
} satisfies Config
