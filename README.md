# react2amp
[![Actions Status](https://github.com/danhuang1202/react2amp/workflows/Node/badge.svg)](https://github.com/danhuang1202/react2amp/actions)
[![NPM version](https://img.shields.io/npm/v/react2amp.svg)](https://www.npmjs.com/package/react2amp)

Easy to migrate exist React App (build by Webpack, babel and Express) to AMP website.

Thanks @savemuse's contrubutes to add support for webpack@5
for webpack@4 users, please use @react2amp@1
for webpack@5 users, please use @react2amp@5

## Features
1. Collect AMP component tags and generate script tag to load these resources, 
2. Support customized AMP component version specification like: `<amp-carousel data-ver="0.2">{...}</amp-carousel>`
3. Collect CSS and generate style tag with `amp-custom` attribute.
4. Provide `useAmp()` to distinguish between AMP and non-AMP pages.

## Installation
```
npm inatall --save react2amp
```

## Modules
- Html

  React component which render whole AMP HTML includes all necessary tags meets AMP HTML specification   
  
  | props | type | required | default | description |
  | --- | --- | --- | --- | --- |
  | head | ReactElement[] | false | [] | Array of `React.Element` tags(such as title, link and meta) |
  | main	| ReactNode | true | - | Main content of application |
  | asset	| Asset |	false | {} | Map of AMP components and css data |
  | styles	| ReactElement[] |	false | [] | Array of `React.Element` styles to support Css-In-Js solutions (<a href="`React.Element`">styled-jsx</a> and <a href="https://www.styled-components.com/docs/advanced#server-side-rendering">styled-components</a>)  |

  ```js
  // Asset type
  type Asset = {
    [entry]: {
      scripts: {
        name: string, 
        version: number
      }
      css: string
    } 
    , ...
  }
  ```

  usage: 
  ```js
  import { renderToString } from 'react-dom/server'
  import { Html } from 'react2amp'

  renderToString(<Html {...} />)
  ```

- AmpProvider
  
  React context provider to indicate components (`children`) that current page is AMP

  usage: 
  ```js
  import React from 'react'
  import { AmpProvider } from 'react2amp'

  function Text() {
    return useAmp() ? "This is Amp page" : "This is non-Amp page"
  }

  function AmpApp() {
    return (
      <AmpProvider>
        /** `useAmp() will return true` */
        <Text />
      </AmpProvider>
    )
  }
  ```

- useAmp
  Distinguish between AMP and non-AMP pages. `useAmp()` will return true inside `AmpProvider`
  
  usage: 
  ```js

  // Image.js
  import React from 'react'
  import {useAmp} from 'react2amp'

  function Image() {
    return (
      {
        useAmp() ? (
          <amp-img {...} />
        ) : (
          <img {...} />
        )
      }
    )
  }
  ```

- webpackPluginAmpAssets
  
  Webpack plugin to collect AMP component tags and css by each entry

  | props | type | required | default | description |
  | --- | --- | --- | --- | --- |
  | filename | string | true | - | The file to write the assets to |
  | includeEntries	| string[] | false | [] | Only collect assets from the entries inside `includeEntries` |
  | excludeJsResourcesRegExp	| RegExp |	false | - | Ignore the module resources match the `excludeJsResourcesRegExp` rules when finding AMP components |
  | excludeCssResourcesRegExp	| RegExp |	false | - | Ignore the module resources match the `excludeCssResourcesRegExp` rules when finding css |

  usage: 
  ```js
  // webpack.config.js
  const AmpAssetsPlugin = require('react2amp/plugin').webpackPluginAmpAssets
  module.exports = {
    entry: {
      entry1: './components/App1.js',
      entry2: './components/App2.js',
      entry3: './components/App3.js'
    },
    ...
    plugins: [
      ...,
      new AmpAssetsPlugin({
        filename: `${build_path}/react2ampAsset.json`,
        includeEntries: ['entry1', 'entry3'],
        excludeResourcesRegExp: /node_modules\/(@babel|lodash|core-js|@apollo|graphql|react|react-dom)\/.*/
      })
    ]
  }
  ```

  The `react2ampAsset.json` would look like
  ```js
    {
      "entry1": {
        "scripts": [
          {
            "name": "amp-form",
            "version": 0.1
          }, {
            "name": "amp-bind",
            "version": 0.1
          }
        ],
        "css": "html{line-height:1.15;}body{margin:0}"
      },
      "entry3": {
        "scripts": [
          {
            "name": "amp-animation",
            "version": 0.1
          }, {
            "name": "amp-carousel",
            "version": 0.2
          }
        ],
        "css": "html{line-height:1.15;}body{margin:0}"
      }
    }
  ```

- babelPluginAmpClassName

  Babel plugin to transpile `className` prop of AMP tags to `class` prop. React will render `className` prop of custom HTML tag (AMP component) as `class` like this: `<amp-img className="image">` => `<amp classname="image">`, check <a href="https://github.com/facebook/react/issues/11347">here</a> for more informatin.
  
  usage: 
  ```js
  // babel.config.js
  const babelPluginAmpClassName = require('react2amp/plugin').babelPluginAmpClassName

  module.exports = {
    presets: [
      ...
    ],
    plugins: [
      ...,
      babelPluginAmpClassName
    ]
  }  
  ```

  Or simply use <a href="https://github.com/danhuang1202/amp-react-components">amp-react-components</a> to render AMP components, which map AMP component's `clsssName` prop to `class` prop.

- expressAmpMiddleware

  Express middleware to response AMP page to client side.

  | props | type | required | default | description |
  | --- | --- | --- | --- | --- |
  | head | ReactElement[] | false | [] | Array of `React.Element` tags(such as title, link and meta) |
  | main	| ReactNode | true | - | Main content of application |
  | asset	| Asset |	false | {} | Map of AMP components and css data |
  | styles	| ReactElement[] |	false | [] | Array of `React.Element` styles to support Css-In-Js solutions (<a href="`React.Element`">styled-jsx</a> and <a href="https://www.styled-components.com/docs/advanced#server-side-rendering">styled-components</a>)  |

  usage: 
  ```js
  import { expressAmpMiddleware } from 'react2amp'
  app.get('/amp/example', expressAmpMiddleware({...}))
  ```

- getAmpAsset

  get assets by entry from JSON file generate by `webpackPluginAmpAssets`

  | props | type | required | default | description |
  | --- | --- | --- | --- | --- |
  | entry | string | true | '' | webpack entry |
  | assetFile	| string | true | '' | assets file |

  usage: 
  ```js
  import { getAmpAsset } from 'react2amp/plugins'
  const entry = 'entry1'
  const assetFilename = `../build/react2ampAsset.json`
  const asset = getAmpAsset(entry, assetFilename)
  ```
  

## Example
`Head.js` render title, description and meta tags into HTML `head` tag. Render `canonical` at
AMP page and `amphtml` at original website. 

```js
// Head.js

import {useAmp} from 'react2amp'

function Head(){
  return (
    <>
      <title>Title</title>
      <meta name="description" content="Description" />
      {
        useAmp() ? (
          /** react2amp will add meta for charset and viewport for AMP pages */
          <link rel="canonical" href="https://www.react2amp.com/example" />
        ) : (
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,minimum-scale=1 initial-scale=1" />
          <link rel="amphtml" href="https://www.react2amp.com/amp/example" />
        )
      }
    </>
  )
}
```

`App.js` render the main application content. Render AMP component(`amp-img`) at
AMP page and `img` tag at original website. 
```js
// App.js

import {useAmp} from 'react2amp'

function App(){
  const props = {...}
  return (
    <div>
      {
        useAmp() ? (
          <amp-img {...props} layout="responsive" />
        ) : (
          <img {...props} />
        )
      }
    </div>
  )
}
```

Add `babelPluginAmpClassName` babel plugin to `babel.config.js` for transpiling `className` prop to `class` prop.

```js
// babel.config.js

const babelPluginAmpClassName = require('react2amp/plugin').babelPluginAmpClassName

module.exports = {
  presets: [
    ...
  ],
  plugins: [
    ...,
    babelPluginAmpClassName
  ]
}
```

Add `AmpAssetsPlugin` webpack plugin to `webpack.config.js` for collecting AMP component tags and css in by entry point.
```js
// webpack.config.js

const AmpAssetsPlugin = require('react2amp/plugin').webpackPluginAmpAssets
module.exports = {
  entry: {
    example: './components/App.js'
  },
  ...
  plugins: [
    ...,
    new AmpAssetsPlugin({
      filename: `${build_path}/react2ampAsset.json`
    })
  ]
}

```

Add `expressAmpMiddleware` express middleware to serve AMP page. And use `AmpProvider`(work with `useAmp()`) if we need to render component earlier to get <a href="https://www.styled-components.com/docs/advanced#server-side-rendering">styles</a> or <a href="https://www.apollographql.com/docs/react/performance/server-side-rendering/#using-rendertostringwithdata">content with data</a> in server side. 
```js
// express.js

import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'
import { AmpProvider } from 'react2amp'
import { expressAmpMiddleware, getAmpAsset } from 'react2amp/plugins'
/** build by webpack AmpAssetsPlugin */
import assets from 'react2ampAsset.json'
import Head from './components/Head'
import App from './components/App'


app.get('/example', (req, res) => {
  ...
  res.status(200)
  res.send(`<!doctype html>\n${renderToStaticMarkup(html)}`)
  res.end()
})

const entry = 'example'
const assetFilename = `${build_path}/react2ampAsset.json`
app.get('/amp/example', expressAmpMiddleware({
  head: <Head />,
  main: <App />,
  asset: getAmpAsset(entry, assetFilename)
}))

/** with styled component */
const sheet = new ServerStyleSheet()
try {
  const main = renderToString(
    <AmpProvider>
      <StyleSheetManager sheet={sheet.instance}>
        <App />
      </StyleSheetManager>
    </AmpProvider>
  )
  const styles = sheet.getStyleElement()
  app.get('/amp/styled/example', expressAmpMiddleware({
    head: <Head />,
    main,
    asset: getAmpAsset(entry, assetFilename),
    styles
  }))
} catch (error) {
  console.error(error)
} finally {
  sheet.seal()
}
```

## Todo
- Update README.md
  - [ ] develop mode
- Add examples
  - [ ] react app with css module
  - [ ] react app with styled component
  - [ ] react app with apollo graphql