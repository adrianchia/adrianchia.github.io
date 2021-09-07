/** @jsx jsx */
import { jsx } from 'theme-ui'

const Button = (props) => (
  <button
  {...props}
  sx={{
    appearance: 'none',
    fontFamily: 'inherit',
    fontSize: 1,
    fontWeight: 'bold',
    m: 0,
    px: 2,
    py: 2,
    color: 'text',

    border: 0,
    borderRadius: 2,
  }}/>
)

export default Button
