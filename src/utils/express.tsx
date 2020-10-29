import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RequestHandler } from 'express'
import Html, { Props } from '../components/Html'

async function renderToAmpHtml({ res, head, main, styles, asset }) {
  let html =
    '<!DOCTYPE html>' +
    renderToStaticMarkup(
      <Html head={head} main={main} asset={asset} styles={styles} />
    )

  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
  }

  res.setHeader('Content-Length', Buffer.byteLength(html))
  res.end(html)
}

function ampMiddleware({ head, main, styles, asset }: Props): RequestHandler {
  return (req, res, next) => {
    try {
      renderToAmpHtml({
        res,
        head,
        main,
        styles,
        asset
      })
    } catch (e) {
      console.error(`render HTML failed, ${e}`)
    } finally {
      next()
    }
  }
}

export { ampMiddleware, renderToAmpHtml }
