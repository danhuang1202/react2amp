import React, { ReactNode } from 'react'

type Props = {
  /** id for amp-state component */
  id: string
  /** A document-scope, mutable JSON state. */
  state: object
}

function AmpState({ id, state }: Props): ReactNode {
  const script = React.createElement('script', {
    type: 'application/json',
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(state)
    }
  })
  return React.createElement('amp-state', { id }, script)
}

export default AmpState
