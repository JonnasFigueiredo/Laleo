import { useCallback, useEffect, useState } from 'react'
import { AdultosTela } from './AdultosTela'
import { AlbumTela } from './AlbumTela'
import { ConversaTela } from './ConversaTela'
import { ExercicioTela } from './ExercicioTela'
import { SelecaoCriancaTela } from './SelecaoCriancaTela'
import { buscarCriancaAtiva, salvarCriancaAtiva } from './criancaAtiva'
import { carregarPerfil, salvarPerfil, type PerfilAvatar } from './avatar/perfis'
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

  // Retoma a última criança usada neste aparelho
  useEffect(() => {
    buscarCriancaAtiva().then((c) => {
      if (c) {
        setCrianca(c)
        setEstrelas(c.estrelas)
        setTela('exercicio')
      }
    })
  }, [])

  const escolherCrianca = useCallback((c: Crianca) => {
    salvarCriancaAtiva(c.id)
    setCrianca(c)
    setEstrelas(c.estrelas)
    setTela('exercicio')
  }, [])

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
