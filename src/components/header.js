/** @jsx jsx */
import { jsx, useColorMode } from 'theme-ui'
import { Link, StaticQuery, graphql } from "gatsby"
import PropTypes from "prop-types"
import NavLink from './nav-link'
import Button from './button'

const modes = ['default', 'dark']

const getModeName = (mode) => {
  switch(mode) {
    case 'dark':
      return 'Dark';
    case 'default':
      return 'Light';
    default:
      return mode;
  }
}

const Header = () => {
  const [ mode, setMode ] = useColorMode()
  const cycleMode = (e) => {
    const i = modes.indexOf(mode)
    const next = modes[(i+1) % modes.length]
    setMode(next)
  }

  return (
    <StaticQuery
      query={graphql`
        query {
          site {
            siteMetadata {
              title,
              social {
                github
                twitter
                linkedin
              }
            }
          }
        }
      `}
      render={
        data => (
          <header
            sx={{
              display: 'flex',
              alignItems: 'center',
              variant: 'styles.header',
            }}
          >
            <Link to="/"
              sx={{
                variant: 'styles.navlink',
                p: 2,
              }}>
              {data.site.siteMetadata.title}
            </Link>
            <div sx={{
              mx: 'auto',
            }} />
            <NavLink to="/about"
              sx={{
                variant: 'styles.navlink',
                p: 2,
              }}
            >
              About
            </NavLink>
            <NavLink to={`https://github.com/${data.site.siteMetadata.social.github}`}
            sx={{
              variant: 'styles.navlink',
              p: 2,
            }}>
              <i class="fab fa-github"></i>
            </NavLink>

            <NavLink to={`https://twitter.com/${data.site.siteMetadata.social.twitter}`}
            sx={{
              variant: 'styles.navlink',
              p: 2,
            }}>
              <i class="fab fa-twitter"></i>
            </NavLink>

            <NavLink to={`https://linkedin.com/in/${data.site.siteMetadata.social.linkedin}`}
            sx={{
              variant: 'styles.navlink',
              p: 2,
            }}>
              <i class="fab fa-linkedin"></i>
            </NavLink>

            <NavLink to="/rss.xml"
            sx={{
              variant: 'styles.navlink',
              p: 2,
            }}>
              <i class="fas fa-rss" />
            </NavLink>

            <Button sx={{
              ml: 2,
            }}
            onClick={cycleMode}>
              {getModeName(mode)}
            </Button>
          </header>
        )
      }
    />
)}

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
