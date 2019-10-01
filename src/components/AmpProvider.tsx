import React, { ReactElement, ReactNode } from 'react'

export const AmpContext = React.createContext({})

type Props = {
  /** React children element */
  children?: ReactNode
}

function AmpProvider({ children }: Props): ReactElement {
  return <AmpContext.Provider value={true}>{children}</AmpContext.Provider>
}

export default AmpProvider
