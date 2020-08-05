import React from "react"
import { graphql, useStaticQuery } from "gatsby"
import GatsbyImage from "gatsby-image"

const Gravatar = () => {
  const { gravatar } = useStaticQuery(query)

  return <GatsbyImage
    style={{
      marginBottom: 0,
      minWidth: 50,
      borderRadius: `50%`,
    }}
    fluid={gravatar.localImage.childImageSharp.fluid} />
}

export default Gravatar

const query = graphql`
  query Gravatar {
    gravatar(email: {eq: "achia@adrianchia.com"}) {
      url
      localImage {
        childImageSharp {
          fluid(maxWidth: 128, maxHeight: 128) {
            ...GatsbyImageSharpFluid_withWebp_tracedSVG
          }
        }
      }
    }
  }
`
