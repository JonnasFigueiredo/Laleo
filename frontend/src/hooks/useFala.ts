import { useCallback } from 'react'

/**
 * TTS do navegador em pt-BR. Serve para o MVP; depois trocamos por um
 * TTS de qualidade servido pelo backend (gateway de IA).
 */
export function useFala() {
  const falar = useCallback((texto: string, aoTerminar?: () => void) => {
    window.speechSynthesis.cancel()
    const fala = new SpeechSynthesisUtterance(texto)
    fala.lang = 'pt-BR'
    fala.rate = 0.85
    fala.pitch = 1.2
    const vozPt = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith('pt'))
    if (vozPt) fala.voice = vozPt
    if (aoTerminar) fala.onend = aoTerminar
    window.speechSynthesis.speak(fala)
  }, [])

  return { falar }
}
