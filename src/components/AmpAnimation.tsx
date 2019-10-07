import React, { ReactNode } from 'react'

type Props = {
  /** id for amp-animation component */
  id: string
  /** A document-scope, mutable JSON animation. */
  animation: object
}

function AmpAnimation({ id, animation }: Props): ReactNode {
  const script = React.createElement('script', {
    type: 'application/json',
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(animation)
    }
  })
  return React.createElement(
    'amp-animation',
    { id, layout: 'nodisplay' },
    script
  )
}

export default AmpAnimation
