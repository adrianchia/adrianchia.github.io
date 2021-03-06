/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/browser-apis/
 */

// You can delete this file if you're not using it
import 'prismjs/themes/prism-okaidia.css'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
const { Prism } = require("prism-react-renderer");
(typeof global !== "undefined" ? global : window).Prism = Prism;
require('prismjs/components/prism-java');
require('prismjs/components/prism-python');
