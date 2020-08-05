import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"
/** @jsx jsx */
import { jsx, useColorMode } from 'theme-ui'
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

const Header = ({ siteTitle }) => {
  const [ mode, setMode ] = useColorMode()
  const cycleMode = (e) => {
    const i = modes.indexOf(mode)
    const next = modes[(i+1) % modes.length]
    setMode(next)
  }

  return (
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
      {siteTitle}
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
    <NavLink to="https://github.com"
     sx={{
       variant: 'styles.navlink',
       p: 2,
     }}>
      <i class="fab fa-github"></i>
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
    variant='background'
    onClick={cycleMode}>
      {getModeName(mode)}
    </Button>
  </header>
)}

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
