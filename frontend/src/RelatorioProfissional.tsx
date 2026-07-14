import { useCallback, useEffect, useState } from 'react'
import { buscarRelatorio, classificarTentativa, listarRevisao, urlAudioTentativa } from './api'
import type { Relatorio, TentativaResumo, TipoErroFono } from './types'

const TIPOS_ERRO: { valor: TipoErroFono; rotulo: string }[] = [
  { valor: 'CORRETO', rotulo: 'Correto' },
  { valor: 'OMISSAO', rotulo: 'Omissão' },
  { valor: 'SUBSTITUICAO', rotulo: 'Substituição' },
  { valor: 'DISTORCAO', rotulo: 'Distorção' },
  { valor: 'ADICAO', rotulo: 'Adição' },
]

/**
 * Devolutiva clínica (Passo 2): métricas por fonema/posição e a fila de
 * revisão onde o fono classifica cada produção. O rótulo do fono prevalece
 * sobre o veredito automático e alimenta a calibração do ASR (Passo 3).
 */
export function RelatorioProfissional({ criancaId }: { criancaId: number }) {
  const [rel, setRel] = useState<Relatorio | null>(null)
  const [fila, setFila] = useState<TentativaResumo[]>([])
  const [erro, setErro] = useState(false)

  const carregar = useCallback(() => {
    setErro(false)
    Promise.all([buscarRelatorio(criancaId), listarRevisao(criancaId)])
      .then(([r, f]) => {
        setRel(r)
        setFila(f)
      })
      .catch(() => setErro(true))
  }, [criancaId])

  useEffect(() => carregar(), [carregar])

  const classificar = async (id: number, tipo: TipoErroFono) => {
    try {
      await classificarTentativa(id, tipo)
      carregar()
    } catch {
      setErro(true)
    }
  }

  if (erro) return <p>Não consegui carregar o relatório clínico.</p>
  if (!rel) return <p>Carregando relatório clínico…</p>
  if (rel.totalProducoes === 0) {
    return <p>Ainda não há produções gravadas para analisar. Pratiquem o “Ouça e repita”.</p>
  }

  return (
    <div className="relatorio-clinico">
      <div className="metricas">
        <div className="metrica">
          <strong>{rel.percentualProducaoCorreta ?? '—'}%</strong>
          <span>produção correta</span>
        </div>
        <div className="metrica">
          <strong>{rel.totalProducoes}</strong>
          <span>produções</span>
        </div>
        <div className="metrica">
          <strong>{rel.sessoes}</strong>
          <span>sessões</span>
        </div>
      </div>

      <div className="rolar-tabela">
        <table className="tabela-fonema">
          <thead>
            <tr>
              <th>Som</th>
              <th>Acertos</th>
              <th>Nota média</th>
              <th>Por posição (I/M/F)</th>
            </tr>
          </thead>
          <tbody>
            {rel.porFonema.map((f) => (
              <tr key={f.fonema}>
                <td>{f.fonema}</td>
                <td>
                  {f.producoesCorretas}/{f.producoesAvaliaveis}
                </td>
                <td>{Math.round(f.notaMedia)}</td>
                <td>
                  {f.porPosicao.length === 0
                    ? '—'
                    : f.porPosicao
                        .map((p) => `${p.posicao[0]}: ${p.corretas}/${p.avaliaveis}`)
                        .join('  ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4>Revisão do profissional</h4>
      <p className="nota-revisao">
        O veredito automático é apenas um palpite (o app não distingue bem os tipos de erro pela
        transcrição). Sua classificação prevalece e ajuda a calibrar o app.
      </p>
      <ul className="fila-revisao">
        {fila.map((t) => (
          <li key={t.id}>
            <div className="rev-cabecalho">
              <strong>{t.palavraAlvo}</strong>
              <span className="rev-fonema">
                som {t.fonemaAlvo}
                {t.posicaoAlvo ? ` · ${t.posicaoAlvo.toLowerCase()}` : ''}
              </span>
            </div>
            <div className="rev-detalhe">
              ouviu-se: “{t.transcricao || '—'}” · auto: {t.resultadoAuto ?? '—'} · nota {t.notaGeral}
            </div>
            {t.temAudio && (
              <audio className="rev-audio" controls preload="none" src={urlAudioTentativa(t.id)} />
            )}
            <select
              className="rev-classificar"
              value={t.tipoErroFono ?? ''}
              onChange={(e) => e.target.value && classificar(t.id, e.target.value as TipoErroFono)}
            >
              <option value="">— classificar —</option>
              {TIPOS_ERRO.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </div>
  )
}
