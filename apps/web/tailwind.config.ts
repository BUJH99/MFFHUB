import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 20px 70px rgba(15, 23, 42, 0.08)'
      },
      colors: {
        hub: {
          purple: '#6d36ff',
          blue: '#1677ff',
          red: '#ff3b55',
          ink: '#0f172a'
        }
      }
    }
  },
  plugins: []
};

export default config;
