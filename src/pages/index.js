/** @jsx jsx */
import { jsx, Themed } from "theme-ui"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"

const IndexPage = ({
  data: {
    allMdx: { edges },
  }
}) => {
  const posts = edges.filter(edge => !!edge.node.frontmatter.date);
  return (
  <Layout>
    <Seo title="Home" />
    <Themed.h1>Posts</Themed.h1>
    <ul sx={{
      listStyle: 'none',
      m: 0,
      px: 3,
      py: 4,
    }}>
    {posts.map(({node}) => {
      const title = node.frontmatter.title || node.fields.slug
      return (
        <li key={node.fields.slug}
          sx={{
            mb: 4,
          }}>
          <Themed.h2 sx={{
            m: 0,
          }}>
            <Link to={node.fields.slug}
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                ':hover,:focus': {
                  color: 'primary',
                  textDecoration: 'underline',
                }
              }}>{title}</Link>
          </Themed.h2>
            <small sx={{ fontWeight: 'bold' }}>{node.frontmatter.date} {` · `}</small>
          <Themed.p>
            {node.excerpt}
          </Themed.p>
          <Link to={node.fields.slug}
              sx={{
                color: 'primary'
              }}>Read</Link>
        </li>
      )
    })}
    </ul>
  </Layout>
)
}

export default IndexPage

export const pageQuery = graphql`
  query {
    allMdx(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          excerpt(pruneLength: 160)
          fields {
            slug
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title

          }
        }
      }
    }
  }
`
