/**
 * Converte a gravação do MediaRecorder (webm/ogg) em WAV mono 16 kHz —
 * formato que o speech-service lê sem depender de ffmpeg no servidor.
 */

const TAXA_ALVO = 16000

export async function gravacaoParaWav(gravacao: Blob): Promise<Blob> {
  const bruto = await gravacao.arrayBuffer()
  const ctxDecodificacao = new AudioContext()
  const decodificado = await ctxDecodificacao.decodeAudioData(bruto)
  void ctxDecodificacao.close()

  const duracao = decodificado.duration
  const ctxOffline = new OfflineAudioContext(1, Math.ceil(duracao * TAXA_ALVO), TAXA_ALVO)
  const fonte = ctxOffline.createBufferSource()
  fonte.buffer = decodificado
  fonte.connect(ctxOffline.destination)
  fonte.start()
  const reamostrado = await ctxOffline.startRendering()

  return codificarWav(reamostrado.getChannelData(0), TAXA_ALVO)
}

function codificarWav(amostras: Float32Array, taxa: number): Blob {
  const buffer = new ArrayBuffer(44 + amostras.length * 2)
  const dv = new DataView(buffer)

  const escreverTexto = (pos: number, texto: string) => {
    for (let i = 0; i < texto.length; i++) dv.setUint8(pos + i, texto.charCodeAt(i))
  }

  escreverTexto(0, 'RIFF')
  dv.setUint32(4, 36 + amostras.length * 2, true)
  escreverTexto(8, 'WAVE')
  escreverTexto(12, 'fmt ')
  dv.setUint32(16, 16, true)
  dv.setUint16(20, 1, true) // PCM
  dv.setUint16(22, 1, true) // mono
  dv.setUint32(24, taxa, true)
  dv.setUint32(28, taxa * 2, true)
  dv.setUint16(32, 2, true)
  dv.setUint16(34, 16, true)
  escreverTexto(36, 'data')
  dv.setUint32(40, amostras.length * 2, true)

  for (let i = 0; i < amostras.length; i++) {
    const v = Math.max(-1, Math.min(1, amostras[i]))
    dv.setInt16(44 + i * 2, v < 0 ? v * 32768 : v * 32767, true)
  }

  return new Blob([buffer], { type: 'audio/wav' })
}
