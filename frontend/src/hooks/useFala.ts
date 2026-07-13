import { useCallback, useEffect, useState } from 'react'
import {
  aoMudarStatusVoz,
  falar as falarLale,
  getNivelAudio,
  prepararVoz,
  usandoFallback,
  type StatusVoz,
} from '../fala/vozLale'

/**
 * Voz do Lalê (TTS neural pt-BR no dispositivo, com fallback para a voz
 * do sistema). O download do modelo começa assim que o app abre, para a
 * primeira fala já sair com a voz boa.
 */
export function useFala() {
  const [statusVoz, setStatusVoz] = useState<StatusVoz>(
    usandoFallback() ? 'fallback' : 'carregando',
  )
  const [progressoVoz, setProgressoVoz] = useState(0)

  useEffect(() => {
    aoMudarStatusVoz((s, progresso) => {
      setStatusVoz(s)
      if (progresso !== undefined) setProgressoVoz(progresso)
    })
    void prepararVoz()
  }, [])

  const falar = useCallback((texto: string, aoTerminar?: () => void) => {
    void falarLale(texto).then(() => aoTerminar?.())
  }, [])

  return { falar, statusVoz, progressoVoz, getNivelAudio }
}
