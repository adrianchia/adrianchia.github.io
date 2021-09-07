/** @jsx jsx */
import { jsx } from "theme-ui"

const Footer = () => (
  <footer sx={{
    width: '100%',
    fontSize: 1,
    variant: 'styles.footer',
  }}>
    <div sx={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      maxWidth: 768,
      mx: 'auto',
      px: 2,
      py: 4,
    }}>
      <div sx={{
        p: 2
      }}>
        © {new Date().getFullYear()}, Built with
    {` `}
        <a href="https://www.gatsbyjs.org" sx={{
          color: 'primary',
        }}>Gatsby</a>
      </div>
    </div>
  </footer>
)

export default Footer
