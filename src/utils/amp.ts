import { useContext } from 'react'
import { AmpContext } from '../components/AmpProvider'

export const useAmp = () => useContext(AmpContext)
