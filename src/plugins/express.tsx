import React, { ReactElement, ReactNode } from 'react'
import ReactDOMServer from 'react-dom/server'
import { RequestHandler } from 'express'
import Html from '../components/Html'
import { getAmpAsset } from '../utils/asset'

type Props = {
  /** Array of React elements for <head /> tags */
  head?: ReactElement[]
  /** Main react element or HTML string */
  main: ReactNode
  /** Array of React elements for style tags */
  styles: ReactElement[]
  /** Regular HTML version of the AMP HTML document */
  canonical: string
  /** webpack entry point */
  entry: string
  /** file path to the asset file */
  assetFile: string
}

function ampMiddleware({
  head,
  main,
  styles,
  canonical,
  entry,
  assetFile
}: Props): RequestHandler {
  const asset = getAmpAsset(entry, assetFile)

  return (req, res, next) => {
    try {
      const html = (
        <Html
          head={head}
          main={main}
          asset={asset}
          styles={styles}
          canonical={canonical}
        />
      )

      res.status(200)
      res.send(`<!doctype html>\n${ReactDOMServer.renderToStaticMarkup(html)}`)
      res.end()
    } catch (e) {
      console.error(`render HTML failed, ${e}`)
    } finally {
      next()
    }
  }
}

export default ampMiddleware
