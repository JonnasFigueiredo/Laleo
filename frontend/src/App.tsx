import { useCallback, useEffect, useState } from 'react'
import { AdultosTela } from './AdultosTela'
import { AlbumTela } from './AlbumTela'
import { ConversaTela } from './ConversaTela'
import { ExercicioTela } from './ExercicioTela'
import { SelecaoCriancaTela } from './SelecaoCriancaTela'
import { buscarAlbum } from './api'
import { buscarCriancaAtiva, salvarCriancaAtiva } from './criancaAtiva'
import {
  PERFIS,
  carregarPerfil,
  perfilDisponivel,
  salvarPerfil,
  type PerfilAvatar,
} from './avatar/perfis'
import { definirPerfilVoz } from './fala/vozLale'
import type { Crianca } from './types'
import './App.css'

type Tela = 'selecao' | 'exercicio' | 'adultos' | 'conversa' | 'album'

function App() {
  const [tela, setTela] = useState<Tela>('selecao')
  const [crianca, setCrianca] = useState<Crianca | null>(null)
  const [estrelas, setEstrelas] = useState(0)
  const [perfil, setPerfil] = useState<PerfilAvatar>(carregarPerfil)

  // Voz sempre coerente com o avatar escolhido
  useEffect(() => {
    definirPerfilVoz(perfil.taxaVoz, perfil.tomFallback)
  }, [perfil])

  // O desbloqueio de avatar é POR CRIANÇA (10 figurinhas): ao ativar uma
  // criança, busca o álbum dela e, se o avatar salvo ainda está bloqueado
  // para ela, volta ao padrão — o irmão sem figurinhas não herda o prêmio
  const ativarCrianca = useCallback((c: Crianca) => {
    setCrianca(c)
    setEstrelas(c.estrelas)
    buscarAlbum(c.id)
      .then((album) => {
        setPerfil((atual) => (perfilDisponivel(atual, album.ganhas.length) ? atual : PERFIS[0]))
      })
      .catch(() => {})
  }, [])

  // Retoma a última criança usada neste aparelho
  useEffect(() => {
    buscarCriancaAtiva().then((c) => {
      if (c) {
        ativarCrianca(c)
        setTela('exercicio')
      }
    })
  }, [ativarCrianca])

  const escolherCrianca = useCallback(
    (c: Crianca) => {
      salvarCriancaAtiva(c.id)
      ativarCrianca(c)
      setTela('exercicio')
    },
    [ativarCrianca],
  )

  const trocarPerfil = (novo: PerfilAvatar) => {
    salvarPerfil(novo.id)
    setPerfil(novo)
  }

  if (tela === 'selecao' || crianca === null) {
    return <SelecaoCriancaTela aoEscolher={escolherCrianca} />
  }

  if (tela === 'conversa') {
    return <ConversaTela perfil={perfil} aoVoltar={() => setTela('exercicio')} />
  }

  if (tela === 'album') {
    return <AlbumTela crianca={crianca} estrelas={estrelas} aoVoltar={() => setTela('exercicio')} />
  }

  if (tela === 'adultos') {
    return (
      <AdultosTela
        aoVoltar={() => setTela('exercicio')}
        perfilAtual={perfil}
        aoTrocarPerfil={trocarPerfil}
        crianca={crianca}
      />
    )
  }

  return (
    <>
      <button
        className="botao-adultos"
        onClick={() => setTela('adultos')}
        aria-label="Área dos adultos"
      >
        👨‍👩‍👧
      </button>
      <button
        className="botao-conversa"
        onClick={() => setTela('conversa')}
        aria-label={`Conversar com ${perfil.nome}`}
      >
        💬
      </button>
      <button className="botao-album" onClick={() => setTela('album')} aria-label="Meu álbum">
        📒
      </button>
      <button
        className="botao-trocar-crianca"
        onClick={() => setTela('selecao')}
        aria-label="Trocar criança"
      >
        {crianca.emoji}
      </button>
      <ExercicioTela
        perfil={perfil}
        crianca={crianca}
        estrelas={estrelas}
        aoGanharEstrelas={setEstrelas}
      />
    </>
  )
}

export default App
