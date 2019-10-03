import React, { ReactElement, ReactNode, isValidElement } from 'react'
import AmpProvider from './AmpProvider'
import { AmpScript } from '../plugins/webpack'

export type Props = {
  /** Array of React elements for <head /> tags */
  head?: ReactElement[]
  /** Main react element or HTML string */
  main: ReactNode
  /** Array of React elements for style tags */
  styles: ReactElement[]
  /** Assets information of AMP components and css */
  asset: {
    scripts?: AmpScript
    css?: string
  }
  /** Regular HTML version of the AMP HTML document */
  canonical: string
}

const AMP_VERSION = 'v0'
const AMP_HOSTNAME = 'https://cdn.ampproject.org/'
const AMP_BOILERPLATE =
  'body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}'
const AMP_NO_SCRIPT_BOILERPLATE =
  'body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}'

function getRuntimeCss(styles: ReactElement[] = []): string {
  if (!styles.length) {
    return ''
  }

  const cssContent = styles.map(style =>
    // @ts-ignore Property 'dangerouslySetInnerHTML' does not exist on type 'unknown'.
    isValidElement(style) ? style.props.dangerouslySetInnerHTML.__html : ''
  )
  return cssContent
    .join('')
    .replace(/\r?\n/g, '')
    .replace(/\/\*.*\*\//, '')
}

function filterHead(head: ReactElement[] = []): ReactElement[] {
  return React.Children.map(head, children => {
    const { type = '', props = {} } = children
    let warning = ''

    if (type === 'meta') {
      if ('charSet' in props) {
        warning =
          '<meta charSet="..." /> already add into <Html />, please remove it'
      } else if (props.name === 'viewport') {
        warning =
          '<meta viewport="..." /> already add into <Html />, please remove it'
      }
    }

    if (warning) {
      console.warn(warning)
      return null
    }

    return children
  })
}

function Html({
  head,
  main,
  asset = {},
  styles = [],
  canonical
}: Props): ReactElement {
  const { scripts = [], css = '' } = asset
  const runtimeCss = getRuntimeCss(styles)
  const headElement = filterHead(head)

  return (
    <AmpProvider>
      <html lang="en-GB" {...{ amp: '' }}>
        <head>
          <meta charSet="utf-8" />
          {headElement}
          <meta
            name="viewport"
            content="width=device-width,minimum-scale=1,initial-scale=1"
          />
          <link rel="canonical" href={canonical} />
          {(css || runtimeCss) && (
            <style amp-custom="">{`${css}${runtimeCss}`}</style>
          )}
          <style amp-boilerplate="">{AMP_BOILERPLATE}</style>
          <noscript>
            <style amp-boilerplate="">{AMP_NO_SCRIPT_BOILERPLATE}</style>
          </noscript>
          <script async src={`${AMP_HOSTNAME}${AMP_VERSION}.js`} />
          {scripts.map(({ name, version }, index) => (
            <script
              key={`amp-component${index}`}
              async
              custom-element={name}
              src={`${AMP_HOSTNAME}${AMP_VERSION}/${name}-${version}.js`}
            />
          ))}
        </head>
        <body>
          {typeof main === 'string' ? (
            <div id="root" dangerouslySetInnerHTML={{ __html: main }} />
          ) : (
            <div id="root">{main}</div>
          )}
        </body>
      </html>
    </AmpProvider>
  )
}

export default Html
