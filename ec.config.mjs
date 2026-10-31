import { defineEcConfig } from 'astro-expressive-code';

// Code blocks follow the site's [data-theme] attribute on <html>, not the OS setting.
export default defineEcConfig({
  themes: ['github-light', 'github-dark'],
  themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
  useDarkModeMediaQuery: false,
  styleOverrides: {
    borderRadius: '8px',
    codeFontFamily: 'var(--font-mono)',
    codeFontSize: '0.875rem',
    uiFontFamily: 'var(--font-sans)',
  },
});
