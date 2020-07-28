import { toTheme } from '@theme-ui/typography'
import fairyGatesTheme from 'typography-theme-fairy-gates'

const theme = toTheme(fairyGatesTheme)

const config = {
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
    }
  },
};

export default {
  ...theme,
  ...config
}
