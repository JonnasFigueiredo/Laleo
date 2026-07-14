import { TtsSession } from '@mintplex-labs/piper-tts-web'
import { deixarFofo } from './pitchFofo'

/**
 * A voz do Lalê: TTS neural pt-BR (Piper, voz "faber") rodando 100% no
 * dispositivo via WASM. O modelo (~60 MB) é baixado na primeira visita e
 * fica em cache (OPFS) — nenhum texto ou áudio sai do aparelho.
 *
 * Se o modelo não carregar (offline, navegador antigo), cai para o
 * speechSynthesis do sistema, mantendo o app funcional.
 */

const VOZ = 'pt_BR-faber-medium'

// Perfil de voz do avatar escolhido (ver avatar/perfis.ts). taxaVoz é o
// multiplicador de PITCH (voz fofa, mais aguda) — a velocidade não muda,
// para a palavra sair clara. tomFallback é o pitch do speechSynthesis.
let taxaVoz = 1.0
let tomFallback = 1.2

export function definirPerfilVoz(taxa: number, tom: number) {
  taxaVoz = taxa
  tomFallback = tom
}

let sessao: TtsSession | null = null
let carregando: Promise<void> | null = null
let neuralFalhou = false

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let dadosOnda: Uint8Array<ArrayBuffer> | null = null
let tocando = false

export type StatusVoz = 'carregando' | 'neural' | 'fallback'

let notificarStatus: ((s: StatusVoz, progresso?: number) => void) | null = null

export function aoMudarStatusVoz(cb: (s: StatusVoz, progresso?: number) => void) {
  notificarStatus = cb
}

export function prepararVoz(): Promise<void> {
  if (sessao || neuralFalhou) return Promise.resolve()
  if (!carregando) {
    notificarStatus?.('carregando', 0)
    carregando = TtsSession.create({
      voiceId: VOZ,
      progress: (p: { loaded: number; total: number }) => {
        if (p.total > 0) notificarStatus?.('carregando', Math.round((p.loaded / p.total) * 100))
      },
      // Runtime WASM auto-hospedado (public/) — sem dependência de CDN,
      // essencial nesta máquina (TLS interceptado) e para uso offline
      wasmPaths: {
        onnxWasm: '/ort/',
        piperData: '/piper/piper_phonemize.data',
        piperWasm: '/piper/piper_phonemize.wasm',
      },
    })
      .then((s) => {
        sessao = s
        notificarStatus?.('neural')
      })
      .catch((e) => {
        console.warn('Voz neural indisponível, usando voz do sistema:', e)
        neuralFalhou = true
        notificarStatus?.('fallback')
      })
  }
  return carregando
}

function garantirAudio(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 512
    dadosOnda = new Uint8Array(analyser.fftSize)
    analyser.connect(audioCtx.destination)
  }
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

/** Nível de 0 a 1 do áudio em reprodução — alimenta a boca do avatar. */
export function getNivelAudio(): number {
  if (!tocando || !analyser || !dadosOnda) return 0
  analyser.getByteTimeDomainData(dadosOnda)
  let soma = 0
  for (let i = 0; i < dadosOnda.length; i++) {
    const desvio = (dadosOnda[i] - 128) / 128
    soma += desvio * desvio
  }
  const rms = Math.sqrt(soma / dadosOnda.length)
  return Math.min(1, rms * 5)
}

async function falarNeural(texto: string): Promise<void> {
  await prepararVoz()
  if (!sessao) throw new Error('sessão de voz indisponível')
  const wav = await sessao.predict(texto)
  const ctx = garantirAudio()
  const original = await ctx.decodeAudioData(await wav.arrayBuffer())
  // Pitch shift preservando a duração: voz fofa e clara (ver pitchFofo.ts)
  const buffer = deixarFofo(ctx, original, taxaVoz)
  return new Promise((resolve) => {
    const fonte = ctx.createBufferSource()
    fonte.buffer = buffer
    fonte.connect(analyser!)
    fonte.onended = () => {
      tocando = false
      resolve()
    }
    tocando = true
    fonte.start()
  })
}

function falarFallback(texto: string): Promise<void> {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel()
    const fala = new SpeechSynthesisUtterance(texto)
    fala.lang = 'pt-BR'
    fala.rate = 0.85
    fala.pitch = tomFallback
    const vozPt = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith('pt'))
    if (vozPt) fala.voice = vozPt
    // O speechSynthesis não passa pelo AudioContext; simulamos o nível
    tocando = true
    fala.onend = () => {
      tocando = false
      resolve()
    }
    window.speechSynthesis.speak(fala)
  })
}

/** speechSynthesis não dá acesso ao áudio: boca anima em ritmo sintético. */
export function usandoFallback(): boolean {
  return neuralFalhou
}

export async function falar(texto: string): Promise<void> {
  if (!neuralFalhou) {
    try {
      await falarNeural(texto)
      return
    } catch (e) {
      console.warn('Falha na voz neural, caindo para voz do sistema:', e)
      neuralFalhou = true
      notificarStatus?.('fallback')
    }
  }
  await falarFallback(texto)
}
