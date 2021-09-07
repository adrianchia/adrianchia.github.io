import React from "react"
import { graphql, StaticQuery } from "gatsby"
import { GatsbyImage } from "gatsby-plugin-image"

const Gravatar = () => (
  <StaticQuery
    query={graphql`
      query Gravatar {
        gravatar(email: {eq: "achia@adrianchia.com"}) {
          url
          localImage {
            childImageSharp {
              gatsbyImageData(width: 128, height: 128)
            }
          }
        }
      }
    `}
    render={data => (
      <GatsbyImage
        style={{
          marginBottom: 0,
          minWidth: 50,
          borderRadius: `50%`,
        }}
        image={data.gravatar.localImage.childImageSharp.gatsbyImageData}
        alt="avatar"
      />
    )}
  />
)

export default Gravatar;
