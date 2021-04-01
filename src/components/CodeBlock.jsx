/** @jsx jsx */
import React from 'react';
import Highlight, { defaultProps } from 'prism-react-renderer';
import { jsx, Themed } from 'theme-ui'
import rangeParser from 'parse-numeric-range';
import okaidia from 'prism-react-renderer/themes/okaidia';

const getShouldHighlightLine = (hl) => {
  if (hl) {
    const lineNumbers = rangeParser(hl);
    return (index) => lineNumbers.includes(index + 1);
  }

  return () => false;
};

const CodeBlock = ({ children, className, hl, title, ...props}) => {
  // MDX will pass the language as className
  // className also includes className(s) theme-ui injected
  const language = className?.replace(/language-/, '') || '';
  if (typeof children !== `string`) {
    // MDX will pass in the code string as children
    return null;
  }

  // determine if we need highlighting
  const shouldHighlightLines = getShouldHighlightLine(hl);

  return (
    <React.Fragment>
      {title && <Themed.div sx={{ variant: `styles.CodeBlock.title` }}>{ title }</Themed.div>}
      <div sx={{ variant: `styles.CodeBlock` }}>
        <Highlight
          {...defaultProps}
          {...props}
          code={children.trim()}
          language={language}
          theme={okaidia}
        >
          {({ className, style, tokens, getLineProps, getTokenProps}) => (
            <Themed.pre
            className={className}
            style={{ ...style }}
            sx={{
              textAlign: 'left',
              margin: '1em 0',
              padding: '0.5em',
              overflow: 'scroll',
            }}
            >
              {tokens.map((line, index) => {
                const lineProps = getLineProps({ line, key: index });

                return (
                  <div
                    key={index}
                    {...lineProps}
                    sx={
                      shouldHighlightLines(index) ? { display: 'table-row', variant: `styles.CodeBlock.highlightLine` } : { display: 'table-row' }
                    }
                  >
                    <span sx={{
                      textAlign: 'right',
                      display: 'table-cell',
                      paddingRight: '1em',
                      userSelect: 'none',
                      opacity: '0.5'
                    }}>{ index + 1}</span>
                    <span sx={{display: 'table-cell'}}>
                      {line.map((token, key) => (
                        <span key={key}{...getTokenProps({ token, key})}/>
                      ))}
                    </span>
                  </div>
                )
              })}
            </Themed.pre>
          )}
        </Highlight>
      </div>
    </React.Fragment>
  );
};

export default CodeBlock;
