import { useEffect, useState } from 'react'
import { buscarAlbum } from './api'
import type { Album, Crianca } from './types'

interface Props {
  crianca: Crianca
  estrelas: number
  aoVoltar: () => void
}

/**
 * Álbum de figurinhas: colecionável de longo prazo (metodologia, seção
 * Gamificação). As não conquistadas aparecem como "?" para dar vontade
 * de completar.
 */
export function AlbumTela({ crianca, estrelas, aoVoltar }: Props) {
  const [album, setAlbum] = useState<Album | null>(null)

  useEffect(() => {
    buscarAlbum(crianca.id).then(setAlbum).catch(() => setAlbum(null))
  }, [crianca.id])

  const ganhas = album?.ganhas ?? []
  const faltam = Math.max(0, (album?.totalCatalogo ?? 0) - ganhas.length)

  return (
    <div className="tela">
      <button className="botao-adultos" onClick={aoVoltar} aria-label="Voltar">
        ↩️
      </button>
      <div className="cartao adultos">
        <h2>
          {crianca.emoji} Álbum de {crianca.nome} — ⭐ {estrelas}
        </h2>
        {album === null ? (
          <p>Carregando o álbum...</p>
        ) : (
          <>
            <p className="resumo-total">
              {ganhas.length} de {album.totalCatalogo} figurinhas!{' '}
              {faltam > 0 ? 'Continue treinando para ganhar mais!' : 'Álbum completo, parabéns! 🎉'}
            </p>
            {/* Recompensa de longo prazo: Moranguinha destrava com 10 figurinhas */}
            {ganhas.length < 10 ? (
              <p className="dica-desbloqueio">
                🔒🍓 Com <strong>10 figurinhas</strong> uma amiguinha surpresa aparece! Faltam{' '}
                {10 - ganhas.length}.
              </p>
            ) : (
              <p className="dica-desbloqueio desbloqueada">
                🍓 A <strong>Moranguinha</strong> chegou! Peça a um adulto para escolher ela na
                área dos responsáveis.
              </p>
            )}
            <div className="grade-figurinhas">
              {ganhas.map((f) => (
                <div key={f.id} className="figurinha" title={f.nome}>
                  <span className="figurinha-emoji">{f.emoji}</span>
                  <span className="figurinha-nome">{f.nome}</span>
                </div>
              ))}
              {Array.from({ length: faltam }).map((_, i) => (
                <div key={`v-${i}`} className="figurinha vazia">
                  <span className="figurinha-emoji">❔</span>
                </div>
              ))}
            </div>
          </>
        )}
        <button className="botao" onClick={aoVoltar}>
          ← Voltar a brincar
        </button>
      </div>
    </div>
  )
}
