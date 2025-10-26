/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}',
    // Exclude content files from scanning (they use markdown, not Tailwind classes)
    '!./src/content/**/*.md',
  ],
  darkMode: 'class',
  // Remove unused utilities more aggressively
  safelist: [],
  theme: {
    extend: {
      colors: {
        // Clean white palette
        paper: '#ffffff',
        cream: '#fafafa',
        'warm-white': '#f8f8f8',
        ivory: '#f5f5f5',

        accent: '#e85d3e',
        'accent-light': '#f4764f',
        'accent-pale': '#facabd',
        'accent-wash': '#fef1ed',

        amber: '#e89950',
        sage: '#7a8c6f',
        burgundy: '#c94a2e',

        // Ink palette
        ink: {
          DEFAULT: '#1a1614',
          medium: '#4a4441',
          light: '#6a6461',
          lighter: '#9a9491',
        },

        line: '#e5e5e5',
        'line-light': '#f0f0f0',
        // Dark mode colors
        dark: {
          bg: {
            primary: '#0a0a0a',
            secondary: '#0f0f0f',
          },
          text: {
            primary: '#f8f8f2',
            secondary: '#d4d4d8',
            tertiary: '#a1a1aa',
          },
          border: {
            primary: '#27272a',
            secondary: '#18181b',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Crimson Text', 'Georgia', 'serif'],
        'serif-body': ['Crimson Text', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
