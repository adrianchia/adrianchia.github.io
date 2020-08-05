import okaidia from '@theme-ui/prism/presets/prism-okaidia.json'

export default {
  useCustomProperties: true,
  initialColorMode: "light",
  space: [
    0,
    4,
    8,
    16,
    32,
    64,
    128,
    256,
    512
  ],
  fonts: {
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    heading: 'inherit',
    monospace: 'Menlo, monospace'
  },
  fontSizes: [
    12,
    14,
    16,
    20,
    24,
    32,
    48,
    64,
    96
  ],
  fontWeights: {
    body: 400,
    heading: 700,
    bold: 700
  },
  lineHeights: {
    body: 1.5,
    heading: 1.125
  },
  colors: {
    text: '#000',
    background: '#fff',
    primary: '#07c',
    secondary: '#30c',
    muted: '#f6f6f6',
    accent: '#639',
    gray: '#666',
    modes: {
      dark: {
        text: '#fff',
        background: '#060606',
        primary: '#3cf',
        secondary: '#e0f',
        muted: '#191919',
        highlight: '#29112c',
        gray: '#999',
        purple: '#c0f',
      },
    },
  },
  layout: {
    container: {
      p: 3,
    }
  },
  buttons: {
    primary: {
      color: 'background',
      bg: 'primary',
      '&:hover': {
        bg: 'text',
      },
      fontWeight: 'bold',
    },
    secondary: {
      variant: 'buttons.primary',
      color: 'background',
      bg: 'secondary',
    },
    black: {
      fontWeight: 'bold',
      color: 'background',
      bg: 'text',
      '&:hover, &:focus': {
        bg: 'primary',
      },
    },
  },
  links: {
    button: {
      display: 'inline-block',
      textDecoration: 'none',
      fontWeight: 'bold',
      fontSize: 2,
      p: 3,
      color: 'background',
      bg: 'text',
      borderRadius: 6,
      '&:hover, &:focus': {
        color: 'background',
        bg: 'primary',
      },
    },
  },
  styles: {
    root: {
      fontFamily: 'body',
      lineHeight: 'body',
      fontWeight: 'body'
    },
    h1: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 5
    },
    h2: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 4
    },
    h3: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 3
    },
    h4: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 2
    },
    h5: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 1
    },
    h6: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 0
    },
    p: {
      color: 'text',
      fontFamily: 'body',
      fontWeight: 'body',
      lineHeight: 'body'
    },
    a: {
      color: 'primary'
    },
    pre: {
      fontFamily: 'monospace',
      overflowX: 'auto',
      code: {
        color: 'inherit'
      }
    },
    code: {
      ...okaidia,
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0
    },
    th: {
      textAlign: 'left',
      borderBottomStyle: 'solid'
    },
    td: {
      textAlign: 'left',
      borderBottomStyle: 'solid'
    },
    img: {
      maxWidth: '100%'
    },
    navlink: {
      display: 'inline-block',
      fontWeight: 'bold',
      color: 'inherit',
      textDecoration: 'none',
      ':hover,:focus': {
        color: 'primary',
      },
    },
  },
}
