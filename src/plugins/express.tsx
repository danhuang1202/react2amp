import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { RequestHandler } from 'express'
import Html, { Props } from '../components/Html'

function ampMiddleware({ head, main, styles, asset }: Props): RequestHandler {
  return (req, res, next) => {
    try {
      const html = (
        <Html head={head} main={main} asset={asset} styles={styles} />
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
