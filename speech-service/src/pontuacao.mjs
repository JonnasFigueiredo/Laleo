/**
 * Pontuação v0: similaridade entre a transcrição e a palavra alvo.
 * Ainda não é GOP por fonema (fase v1) — mas já diferencia acerto de erro
 * de verdade, ao contrário do mock.
 */

export function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  const linha = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    let diagonal = linha[0]
    linha[0] = i
    for (let j = 1; j <= n; j++) {
      const anterior = linha[j]
      linha[j] = Math.min(
        linha[j] + 1,
        linha[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      diagonal = anterior
    }
  }
  return linha[n]
}

export function similaridade(a, b) {
  const na = normalizar(a)
  const nb = normalizar(b)
  if (!na || !nb) return 0
  const distancia = levenshtein(na, nb)
  return Math.max(0, 1 - distancia / Math.max(na.length, nb.length))
}

/**
 * Monta a resposta do contrato a partir da transcrição.
 * O fonema alvo ganha um ajuste: se o grafema correspondente sumiu da
 * transcrição (ex.: criança falou "ato" para "rato"), a nota dele cai mais.
 */
export function pontuar(transcricao, palavraAlvo, fonemaAlvo) {
  const sim = similaridade(transcricao, palavraAlvo)
  const notaGeral = Math.round(sim * 100)

  const grafema = normalizar(fonemaAlvo)
  const alvoTemGrafema = normalizar(palavraAlvo).includes(grafema)
  const transcricaoTemGrafema = normalizar(transcricao).includes(grafema)
  const notaFonema =
    alvoTemGrafema && !transcricaoTemGrafema
      ? Math.round(notaGeral * 0.5)
      : notaGeral

  return {
    palavraAlvo,
    transcricao,
    notaGeral,
    fonemas: [{ fonema: fonemaAlvo.toUpperCase(), nota: notaFonema }],
  }
}
