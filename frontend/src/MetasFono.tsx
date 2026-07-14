import { useCallback, useEffect, useState } from 'react'
import { adicionarMeta, listarExercicios, listarMetas, removerMeta } from './api'
import type { Meta } from './types'

/**
 * Metas do fono (Passo 2): o profissional escolhe os sons-alvo da criança.
 * O app prioriza esses exercícios na trilha (ver ExercicioTela) — assim a
 * prática em casa segue o que foi definido na terapia.
 */
export function MetasFono({ criancaId }: { criancaId: number }) {
  const [metas, setMetas] = useState<Meta[]>([])
  const [fonemas, setFonemas] = useState<string[]>([])
  const [sel, setSel] = useState('')

  const carregar = useCallback(() => {
    listarMetas(criancaId)
      .then(setMetas)
      .catch(() => setMetas([]))
  }, [criancaId])

  useEffect(() => carregar(), [carregar])

  useEffect(() => {
    listarExercicios()
      .then((ex) => setFonemas([...new Set(ex.map((e) => e.fonemaAlvo))].sort()))
      .catch(() => setFonemas([]))
  }, [])

  const adicionar = async () => {
    if (!sel) return
    await adicionarMeta(criancaId, sel)
    setSel('')
    carregar()
  }

  const remover = async (id: number) => {
    await removerMeta(id)
    carregar()
  }

  const ativos = new Set(metas.map((m) => m.fonema))
  const disponiveis = fonemas.filter((f) => !ativos.has(f))

  return (
    <div className="metas-fono">
      {metas.length === 0 ? (
        <p className="nota-revisao">
          Nenhuma meta definida. Escolha os sons que a criança vai treinar — o app coloca esses
          exercícios primeiro na trilha.
        </p>
      ) : (
        <div className="chips-meta">
          {metas.map((m) => (
            <span key={m.id} className="chip-meta">
              som {m.fonema}
              <button
                className="chip-x"
                aria-label={`Remover meta do som ${m.fonema}`}
                onClick={() => remover(m.id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="add-meta">
        <select value={sel} onChange={(e) => setSel(e.target.value)}>
          <option value="">— escolher som —</option>
          {disponiveis.map((f) => (
            <option key={f} value={f}>
              som {f}
            </option>
          ))}
        </select>
        <button className="botao secundario" onClick={adicionar} disabled={!sel}>
          Adicionar meta
        </button>
      </div>
    </div>
  )
}
