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
    input: 'src/plugins/index.ts',
    output: [
      {
        dir: 'lib/plugins',
        format: 'cjs'
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
