import postcss from 'postcss'
import cssnano from 'cssnano'

function optimize(css: string): string {
  return postcss(cssnano({ preset: 'default' })).process(css).css
}

export default optimize
