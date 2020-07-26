import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import Image from "../components/image"
import SEO from "../components/seo"
import { rhythm } from "../utils/typography"

const IndexPage = ({
  data: {
    allMdx: { edges },
  }
}) => {
  const posts = edges.filter(edge => !!edge.node.frontmatter.date);
  return (
  <Layout>
    <SEO title="Home" />
    <h1>Hi people</h1>
    <p>Welcome to your new Gatsby site.</p>
    <p>Now go build something great.</p>
    <div style={{ maxWidth: `300px`, marginBottom: `1.45rem` }}>
      <Image />
    </div>
    {posts.map(({node}) => {
      const title = node.frontmatter.title || node.fields.slug
      return (
        <article key={node.fields.slug}>
          <header
            style={{
              marginBottom: rhythm(1 / 4),
            }}
          >
            <h3>
              <Link style={{
                boxShadow: `none`
              }}
            to={node.fields.slug}>{title}</Link>
            </h3>
          </header>
          <section>
            <p dangerouslySetInnerHTML={{
              __html: node.excerpt,
            }}/>
          </section>
        </article>
      )
    })}
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
            readingTime {
              text
            }
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
