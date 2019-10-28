import Html from './components/Html'
import AmpProvider from './components/AmpProvider'
import { useAmp } from './utils/amp'
import {
  ampMiddleware as expressAmpMiddleware,
  renderToAmpHtml
} from './utils/express'

export { Html, AmpProvider, useAmp, expressAmpMiddleware, renderToAmpHtml }
