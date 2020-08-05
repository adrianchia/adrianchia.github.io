export default {
  useCustomProperties: true,
  initialColorMode: "light",
  colors: {
    text: '#000',
    background: '#fff',
    primary: '#07c',
    modes: {
      dark: {
        text: '#fff',
        background: '#000',
        primary: '#0cf'
      },
    },
  },
  layout: {
    container: {
      p: 3,
    }
  },
  styles: {
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
