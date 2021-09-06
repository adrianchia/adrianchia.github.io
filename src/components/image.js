import React from "react"
import { StaticQuery, graphql } from "gatsby"
import { GatsbyImage } from "gatsby-plugin-image"

const Image = () => {
  return (
    <StaticQuery
      query={graphql`
      query {
        placeholderImage: file(relativePath: { eq: "gatsby-astronaut.png" }) {
          childImageSharp {
            gatsbyImageData(layout: CONSTRAINED, width: 300)
          }
        }
      }
    `}
    render={data => (
      <GatsbyImage image={data.placeholderImage.childImageSharp.gatsbyImageData} />
    )}
    />
  )
}

export default Image
