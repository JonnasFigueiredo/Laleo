import { useCallback, useRef, useState } from 'react'

/**
 * Gravação de áudio via MediaRecorder. O áudio existe só em memória
 * até ser enviado para análise — nada é salvo no aparelho.
 */
export function useGravador() {
  const [gravando, setGravando] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  const iniciar = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // Desliga o processamento do navegador: cancelamento de eco, supressão
        // de ruído e ganho automático distorcem a produção real da criança
        // (cortam fricativas fracas, bombeiam o ganho) — ruim para a análise
        // fonética. São dicas: o navegador pode ignorar, mas quando respeita
        // a gravação fica fiel ao que a criança falou.
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
    })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
    recorder.start()
    recorderRef.current = recorder
    setGravando(true)
  }, [])

  const parar = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const recorder = recorderRef.current
      if (!recorder) {
        reject(new Error('Gravação não foi iniciada'))
        return
      }
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((t) => t.stop())
        setGravando(false)
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType }))
      }
      recorder.stop()
    })
  }, [])

  return { gravando, iniciar, parar }
}
