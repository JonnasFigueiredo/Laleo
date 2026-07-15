/**
 * Checagem de qualidade da gravação antes de mandar para análise. Evita
 * enviar áudio que não dá para avaliar (criança não falou, microfone mudo,
 * clique rápido) — nesses casos pedimos para repetir em vez de dar uma nota
 * sem sentido. As métricas também servem de base para sinalizar gravações
 * ruins na revisão do fonoaudiólogo (Passo 2).
 */

export interface QualidadeAudio {
  duracaoMs: number
  /** Energia média (0–1): proxy de volume. */
  rms: number
  /** Pico em dBFS (0 = máximo). */
  picoDb: number
  /** % de amostras no teto (indício de distorção por volume alto demais). */
  clipPct: number
  ok: boolean
  /** Por que reprovou, quando ok = false. */
  motivo?: 'curto' | 'baixo'
}

// Limiares iniciais, ajustáveis com dados reais (ver roadmap-clinico.md).
// RMS_MINIMO = MESMO valor do gate do speech-service (servidor.mjs): um gate
// local mais rígido rejeitava fala baixinha que o pipeline aceitaria — e com o
// ganho automático desligado (useGravador) a criança quieta grava ainda mais baixo.
const DURACAO_MINIMA_MS = 300
const RMS_MINIMO = 0.005

export async function analisarQualidade(gravacao: Blob): Promise<QualidadeAudio> {
  const ctx = new AudioContext()
  let buffer: AudioBuffer
  try {
    buffer = await ctx.decodeAudioData(await gravacao.arrayBuffer())
  } finally {
    void ctx.close()
  }

  const amostras = buffer.getChannelData(0)
  const duracaoMs = buffer.duration * 1000

  let soma = 0
  let pico = 0
  let clipadas = 0
  for (let i = 0; i < amostras.length; i++) {
    const abs = Math.abs(amostras[i])
    soma += amostras[i] * amostras[i]
    if (abs > pico) pico = abs
    if (abs > 0.99) clipadas++
  }
  const rms = amostras.length ? Math.sqrt(soma / amostras.length) : 0
  const picoDb = pico > 0 ? 20 * Math.log10(pico) : -Infinity
  const clipPct = amostras.length ? (clipadas / amostras.length) * 100 : 0

  let ok = true
  let motivo: QualidadeAudio['motivo']
  if (duracaoMs < DURACAO_MINIMA_MS) {
    ok = false
    motivo = 'curto'
  } else if (rms < RMS_MINIMO) {
    ok = false
    motivo = 'baixo'
  }

  return { duracaoMs, rms, picoDb, clipPct, ok, motivo }
}
