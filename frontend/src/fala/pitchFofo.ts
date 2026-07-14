import { SimpleFilter, SoundTouch, WebAudioBufferSource } from 'soundtouchjs'

/**
 * Deixa a voz mais aguda (fofa) SEM mudar a velocidade — importante para a
 * criança ouvir a palavra no ritmo natural e conseguir imitar. Processa o
 * buffer do Piper offline com o SoundTouch (pitch shift preservando a
 * duração) e devolve um novo AudioBuffer.
 *
 * `pitch` é multiplicador: 1.0 = sem mudança; 1.3 = ~30% mais agudo.
 */
// O SimpleFilter do soundtouchjs só processa quando o buffer de entrada tem
// ≥ 16384 amostras. Palavras curtas do Piper ficam abaixo disso, então
// preenchemos com silêncio no fim, processamos e cortamos de volta.
const PREENCHIMENTO = 16384 * 2

export function deixarFofo(ctx: AudioContext, entrada: AudioBuffer, pitch: number): AudioBuffer {
  if (pitch === 1) return entrada

  const tamOriginal = entrada.length
  const preenchido = ctx.createBuffer(1, tamOriginal + PREENCHIMENTO, entrada.sampleRate)
  preenchido.copyToChannel(entrada.getChannelData(0), 0)

  const st = new SoundTouch()
  st.pitch = pitch
  st.tempo = 1 // mantém a duração

  const fonte = new WebAudioBufferSource(preenchido)
  const filtro = new SimpleFilter(fonte, st)

  // O SoundTouch processa sempre em estéreo intercalado (L,R,L,R). A voz do
  // Piper é mono; internamente L=R, então lemos só o canal esquerdo na saída.
  const BLOCO = 4096
  const intercalado = new Float32Array(BLOCO * 2)
  let saida: Float32Array<ArrayBuffer> = new Float32Array(0)

  let extraidos = 0
  while ((extraidos = filtro.extract(intercalado, BLOCO)) > 0) {
    const anterior = saida
    saida = new Float32Array(anterior.length + extraidos)
    saida.set(anterior)
    for (let i = 0; i < extraidos; i++) saida[anterior.length + i] = intercalado[i * 2]
  }

  // Corta o silêncio de preenchimento: com tempo=1 a fala mantém a duração
  const util = saida.subarray(0, Math.min(saida.length, tamOriginal))
  const buffer = ctx.createBuffer(1, Math.max(1, util.length), entrada.sampleRate)
  buffer.copyToChannel(util, 0)
  return buffer
}
