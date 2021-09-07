/** @jsx jsx */
/* eslint jsx-a11y/anchor-has-content: 0 */
import { jsx } from 'theme-ui'
import { Link } from 'gatsby'
import isAbsoluteURL from 'is-absolute-url'

const styles = {
  variant: 'links.nav'
}

const NavLink = ({href, ...props}) => {
  const isExternal = isAbsoluteURL(href || '')
  if (isExternal) {
    return <a {...props} href={href} sx={styles} />
  }

  const to = props.to || href
  return <Link {...props} to={to} sx={styles} activeClassName="active" />
}

export default NavLink
