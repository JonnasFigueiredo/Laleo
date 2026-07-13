/**
 * Parser WAV mínimo (RIFF/PCM 16-bit) → Float32Array mono 16 kHz,
 * o formato que o Whisper espera. Sem ffmpeg: o frontend já envia WAV.
 */

export function wavParaFloat32Mono16k(buffer) {
  const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  if (dv.getUint32(0, false) !== 0x52494646 /* RIFF */) {
    throw new Error('não é um arquivo WAV (RIFF ausente)')
  }

  let pos = 12
  let sampleRate = 0
  let canais = 1
  let bits = 16
  let dados = null

  while (pos + 8 <= dv.byteLength) {
    const id = dv.getUint32(pos, false)
    const tamanho = dv.getUint32(pos + 4, true)
    if (id === 0x666d7420 /* fmt  */) {
      canais = dv.getUint16(pos + 10, true)
      sampleRate = dv.getUint32(pos + 12, true)
      bits = dv.getUint16(pos + 22, true)
    } else if (id === 0x64617461 /* data */) {
      dados = { inicio: pos + 8, tamanho: Math.min(tamanho, dv.byteLength - pos - 8) }
    }
    pos += 8 + tamanho + (tamanho % 2)
  }

  if (!dados || !sampleRate) throw new Error('WAV sem chunks fmt/data')
  if (bits !== 16) throw new Error(`WAV com ${bits} bits não suportado (esperado 16)`)

  const totalAmostras = Math.floor(dados.tamanho / 2 / canais)
  const mono = new Float32Array(totalAmostras)
  for (let i = 0; i < totalAmostras; i++) {
    let soma = 0
    for (let c = 0; c < canais; c++) {
      soma += dv.getInt16(dados.inicio + (i * canais + c) * 2, true)
    }
    mono[i] = soma / canais / 32768
  }

  if (sampleRate === 16000) return mono

  // Reamostragem linear simples para 16 kHz
  const fator = sampleRate / 16000
  const saida = new Float32Array(Math.floor(totalAmostras / fator))
  for (let i = 0; i < saida.length; i++) {
    const origem = i * fator
    const base = Math.floor(origem)
    const frac = origem - base
    const proximo = Math.min(base + 1, totalAmostras - 1)
    saida[i] = mono[base] * (1 - frac) + mono[proximo] * frac
  }
  return saida
}
