import React from 'react'
import { StaticQuery, graphql } from 'gatsby'
//import Image from 'gatsby-image'
import Gravatar from './gravatar'

function Bio() {
  return (
    <StaticQuery
      query={bioQuery}
      render={data => {
        const { author, social } = data.site.siteMetadata
        return (
          <div
            style={{
              display: `flex`,
            }}
          >
            <span style={{
              width: 50,
              height: 50
            }}>
            <Gravatar/>
            </span>
            <p>
              Written by <strong>{author}</strong> who lives and works in
              Texas building silly things.
              {` `}
              <a href={`https://twitter.com/${social.twitter}`}>
                You should follow him on Twitter
              </a>
            </p>
          </div>
        )
      }}
    />
  )
}

const bioQuery = graphql`
  query BioQuery {
    avatar: file(absolutePath: { regex: "/profile-pic.jpg/" }) {
      childImageSharp {
        fixed(width: 50, height: 50) {
          ...GatsbyImageSharpFixed
        }
      }
    }
    site {
      siteMetadata {
        author
        social {
          twitter
        }
      }
    }
  }
`

export default Bio
