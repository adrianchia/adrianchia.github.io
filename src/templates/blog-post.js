import React from 'react'
import { Link, graphql } from 'gatsby'
import { MDXRenderer } from 'gatsby-plugin-mdx'

import Bio from '../components/bio'
import Layout from '../components/layout'
import SEO from '../components/seo'
import { Disqus } from 'gatsby-plugin-disqus'
import "katex/dist/katex.min.css"

const BlogPostTemplate = ({ pageContext, data, location }) => {
    const post = data.mdx
    const siteTitle = data.site.siteMetadata.title
    const { previous, next } = pageContext
    const disqusConfig = {
      url: `${data.site.siteMetadata.siteUrl + location.pathname}`,
      identifier: post.id,
      title: post.title
    }

    return (
      <Layout location={location} title={siteTitle}>
        <SEO title={post.frontmatter.title} description={post.excerpt} />
        <h1>{post.frontmatter.title}</h1>
        <p>
          {post.frontmatter.date}
          {`  `}
          { post.fields.readingTime.text }
        </p>

        <MDXRenderer>{post.body}</MDXRenderer>
        <hr
        />
        <Bio />
        <Disqus config={disqusConfig} />
        <ul
          style={{
            display: `flex`,
            flexWrap: `wrap`,
            justifyContent: `space-between`,
            listStyle: `none`,
            padding: 0,
          }}
        >
          <li>
            {previous && (
              <Link to={previous.fields.slug} rel="prev">
                ← {previous.frontmatter.title}
              </Link>
            )}
          </li>
          <li>
            {next && (
              <Link to={next.fields.slug} rel="next">
                {next.frontmatter.title} →
              </Link>
            )}
          </li>
        </ul>
      </Layout>
    )

}

export default BlogPostTemplate

export const pageQuery = graphql`
  query($slug: String!) {
    site {
      siteMetadata {
        title
        author
        siteUrl
      }
    }
    mdx(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
      }
      fields {
        readingTime {
          text
        }
      }
      body
    }
  }
`
