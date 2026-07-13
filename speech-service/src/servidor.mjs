import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { pipeline } from '@huggingface/transformers'
import { wavParaFloat32Mono16k } from './wav.mjs'
import { pontuar } from './pontuacao.mjs'

/**
 * speech-service v0 do Laleo: transcreve a gravação (Whisper) e pontua
 * contra a palavra alvo. Ver CONTRATO.md. Stateless: o áudio é processado
 * em memória e descartado (LGPD).
 */

const PORTA = Number(process.env.PORTA ?? 8090)
// whisper-small acerta bem mais que o base em palavras isoladas pt-BR
// (teste com "rato": small → "Grato" (~80), base → "Caraco" (~50))
const MODELO = process.env.MODELO ?? 'onnx-community/whisper-small'

let transcritor = null
async function garantirModelo() {
  if (!transcritor) {
    console.log(`Carregando ${MODELO}... (primeira vez baixa o modelo)`)
    transcritor = await pipeline('automatic-speech-recognition', MODELO, { dtype: 'q8' })
    console.log('Modelo pronto.')
  }
  return transcritor
}

const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok', modelo: MODELO, pronto: transcritor !== null }))

// Transcrição pura para a conversa livre (sem nota de pronúncia)
app.post('/transcrever', async (c) => {
  const form = await c.req.formData().catch(() => null)
  const audio = form?.get('audio')
  if (!audio || typeof audio === 'string') {
    return c.json({ erro: 'campo obrigatório: audio (wav)' }, 400)
  }

  let amostras
  try {
    amostras = wavParaFloat32Mono16k(Buffer.from(await audio.arrayBuffer()))
  } catch (e) {
    return c.json({ erro: `áudio inválido: ${e.message}` }, 400)
  }

  let energia = 0
  for (let i = 0; i < amostras.length; i++) energia += amostras[i] * amostras[i]
  if (Math.sqrt(energia / amostras.length) < 0.005) {
    return c.json({ erro: 'nenhuma fala detectada na gravação' }, 422)
  }

  const asr = await garantirModelo()
  const resultado = await asr(amostras, {
    language: 'portuguese',
    task: 'transcribe',
    max_new_tokens: 64,
  })
  const transcricao = (resultado.text ?? '').trim()
  if (!transcricao) {
    return c.json({ erro: 'nenhuma fala detectada na gravação' }, 422)
  }
  return c.json({ transcricao })
})

app.post('/analisar', async (c) => {
  const form = await c.req.formData().catch(() => null)
  const audio = form?.get('audio')
  const palavraAlvo = form?.get('palavraAlvo')
  const fonemaAlvo = form?.get('fonemaAlvo')

  if (!audio || typeof audio === 'string' || !palavraAlvo || !fonemaAlvo) {
    return c.json({ erro: 'campos obrigatórios: audio (wav), palavraAlvo, fonemaAlvo' }, 400)
  }

  let amostras
  try {
    amostras = wavParaFloat32Mono16k(Buffer.from(await audio.arrayBuffer()))
  } catch (e) {
    return c.json({ erro: `áudio inválido: ${e.message}` }, 400)
  }

  // Whisper alucina em silêncio: barra gravações sem energia antes de transcrever
  let energia = 0
  for (let i = 0; i < amostras.length; i++) energia += amostras[i] * amostras[i]
  const rms = Math.sqrt(energia / amostras.length)
  if (rms < 0.005) {
    return c.json({ erro: 'nenhuma fala detectada na gravação' }, 422)
  }

  const asr = await garantirModelo()
  const resultado = await asr(amostras, {
    language: 'portuguese',
    task: 'transcribe',
    max_new_tokens: 32,
  })
  const transcricao = (resultado.text ?? '').trim()

  if (!transcricao) {
    return c.json({ erro: 'nenhuma fala detectada na gravação' }, 422)
  }

  return c.json(pontuar(transcricao, String(palavraAlvo), String(fonemaAlvo)))
})

// Baixa o modelo já na subida para a primeira análise não esperar
garantirModelo().catch((e) => console.error('Falha ao carregar modelo:', e.message))

serve({ fetch: app.fetch, port: PORTA }, (info) => {
  console.log(`speech-service ouvindo em http://localhost:${info.port}`)
})
