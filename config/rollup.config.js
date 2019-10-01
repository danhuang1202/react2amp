import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import pkg from '../package.json'

const extensions = ['.ts', '.tsx']

const entries = [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs'
      },
      {
        file: pkg.module,
        format: 'es'
      }
    ]
  },
  {
    input: 'src/components/Html.tsx',
    output: [
      {
        dir: 'lib/components',
        format: 'cjs'
      },
      {
        dir: 'es/components',
        format: 'es'
      }
    ]
  },
  {
    input: 'src/plugins/babel.ts',
    output: [
      {
        dir: 'lib/plugins',
        format: 'cjs'
      },
      {
        dir: 'es/plugins',
        format: 'es'
      }
    ]
  },
  {
    input: 'src/plugins/express.tsx',
    output: [
      {
        dir: 'lib/plugins',
        format: 'cjs'
      },
      {
        dir: 'es/plugins',
        format: 'es'
      }
    ]
  },
  {
    input: 'src/plugins/webpack.ts',
    output: [
      {
        dir: 'lib/plugins',
        format: 'cjs'
      },
      {
        dir: 'es/plugins',
        format: 'es'
      }
    ]
  },
  {
    input: 'src/utils/amp.ts',
    output: [
      {
        dir: 'lib/utils',
        format: 'cjs'
      },
      {
        dir: 'es/utils',
        format: 'es'
      }
    ]
  },
  {
    input: 'src/utils/asset.ts',
    output: [
      {
        dir: 'lib/utils',
        format: 'cjs'
      },
      {
        dir: 'es/utils',
        format: 'es'
      }
    ]
  }
]

const plugins = [
  external(),
  commonjs(),
  babel({
    extensions,
    exclude: 'node_modules/**'
  }),
  resolve({
    extensions
  })
]

const options = entries.map(entry => ({
  ...entry,
  plugins
}))

export default options
