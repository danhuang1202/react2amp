import Html from './components/Html'
import { getAmpAsset } from './utils/asset'
import { useAmp } from './utils/amp'
import babelPluginAmpClassName from './plugins/babel'
import webpackPluginAmpAssets from './plugins/webpack'
import expressAmpMiddleware from './plugins/express'

export {
  Html,
  useAmp,
  getAmpAsset,
  babelPluginAmpClassName,
  webpackPluginAmpAssets,
  expressAmpMiddleware
}
