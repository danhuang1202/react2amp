import Html from './components/Html'
import { useAmp } from './utils'
import babelPluginAmpClassName from './plugins/babel'
import webpackPluginAmpAssets from './plugins/webpack'
import expressAmpMiddleware from './plugins/express'

export {
  Html,
  useAmp,
  babelPluginAmpClassName,
  webpackPluginAmpAssets,
  expressAmpMiddleware
}
