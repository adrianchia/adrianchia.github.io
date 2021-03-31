/** @jsx jsx */
import { jsx, Styled } from "theme-ui"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"

const AboutPage = () => (
  <Layout>
    <Seo title="About" />
    <Styled.h1>Hi there!</Styled.h1>
    <Styled.p>
      I am Adrian Chia. I am a Systems Architect at <Link to="https://www.smithweb.com">Smith</Link> working on numerous projects involving software development, cloud and ETL infrastructures as well as Data Science. All opinions my own.
    </Styled.p>

    <Styled.p>
    In my free time I explore different areas like Artificial Intelligence, Machine Learning, Computer Vision, Big Data, Cloud and Mobile Apps Development.
    </Styled.p>
  </Layout>
)

export default AboutPage
