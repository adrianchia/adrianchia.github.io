/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */
/** @jsx jsx */
import { jsx, Styled, Flex, Box } from 'theme-ui'
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"

import Header from "./header"
//import "./layout.css"
import "@fortawesome/fontawesome-free/js/all.min.js"
import Footer from "./footer"
import { MDXProvider } from '@mdx-js/react'
import CodeBlock from './CodeBlock'

const components = {
  pre: props => <div {...props} />,
  code: CodeBlock
}

const Layout = ({ children }) => {

  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <MDXProvider components={ components }>
      <Styled.root>
        <Flex sx={{
            flexDirection: 'column',
            minHeight: '100vh',
          }}>
          <Header siteTitle={data.site.siteMetadata.title} />
          <Box sx={{
            flex: '1 1 auto',
          }}>
          <div sx={{
            display: ['block', 'flex']
          }}>
            <main id="content"
              sx={{
                width: '100%',
                minWidth: 0,
                maxWidth: 768,
                mx: 'auto',
                px: 3
              }}
            >{children}</main>

          </div>
          <Footer/>
          </Box>

        </Flex>
      </Styled.root>
    </MDXProvider>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
