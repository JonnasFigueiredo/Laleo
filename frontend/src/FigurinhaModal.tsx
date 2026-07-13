import { useMemo } from 'react'
import type { FigurinhaGanha } from './types'

interface Props {
  figurinha: FigurinhaGanha
  aoFechar: () => void
}

/** Celebração multissensorial: figurinha surpresa + confete (o avatar fala junto). */
export function FigurinhaModal({ figurinha, aoFechar }: Props) {
  const confetes = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        esquerda: Math.random() * 100,
        atraso: Math.random() * 1.4,
        cor: ['#ffd23f', '#ff6b8a', '#7c5cff', '#4dd599', '#4fb3ff'][i % 5],
        duracao: 2 + Math.random() * 1.6,
      })),
    [],
  )

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      {confetes.map((c) => (
        <span
          key={c.id}
          className="confete"
          style={{
            left: `${c.esquerda}%`,
            backgroundColor: c.cor,
            animationDelay: `${c.atraso}s`,
            animationDuration: `${c.duracao}s`,
          }}
        />
      ))}
      <div className="modal-figurinha" onClick={(e) => e.stopPropagation()}>
        <p className="fonema">Figurinha nova!</p>
        <span className="figurinha-grande">{figurinha.emoji}</span>
        <h2 className="palavra">{figurinha.nome}</h2>
        <button className="botao" onClick={aoFechar}>
          🎉 Uhuu!
        </button>
      </div>
    </div>
  )
}
