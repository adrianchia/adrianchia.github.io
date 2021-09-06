/** @jsx jsx */
import { jsx, Themed } from "theme-ui"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"

const AboutPage = () => (
  <Layout>
    <Seo title="About" />
    <Themed.h1>Hi there!</Themed.h1>
    <Themed.p>
      I am Adrian Chia. I am a Software Engineer at <Link to="https://www.jpmorganchase.com/">JPMorgan Chase &amp; Co.</Link> working on numerous projects involving software development, cloud and ETL infrastructures as well as Data Science. All opinions my own.
    </Themed.p>

    <Themed.p>
    In my free time I explore different areas like Artificial Intelligence, Machine Learning, Computer Vision, Big Data, Cloud and Mobile Apps Development.
    </Themed.p>
  </Layout>
)

export default AboutPage
