import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"
import { rhythm, scale } from "../utils/typography"

const Header = ({ siteTitle }) => (
  <header
    style={{
      background: `rebeccapurple`,
      marginBottom: `1.45rem`,
    }}
  >
    <div
      style={{
        margin: `0 auto`,
        maxWidth: 960,
        padding: `1.45rem 1.0875rem`,
      }}
    >
      <h1 style={{
        ...scale(1.5),
        marginBottom: rhythm(1.5),
        marginTop: 0
      }}>
        <Link
          to="/"
          style={{
            color: `white`,
            boxShadow: `none`,
            textDecoration: `none`,
          }}
        >
          {siteTitle}
        </Link>
      </h1>
    </div>
  </header>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
