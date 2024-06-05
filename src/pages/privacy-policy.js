/** @jsx jsx */
import { jsx, Themed } from "theme-ui"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"

const PrivacyPolicyPage = () => (
  <Layout>
    <Seo title="Privacy Policy" />
    <Themed.span sx={{
      display: 'block',
      margin: '0 auto 3.125rem',
      width: '11.125rem',
      height: '2.375rem',
    }}>

    </Themed.span>
  </Layout>
)

export default PrivacyPolicyPage
