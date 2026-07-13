import { useEffect, useState } from 'react'
import { AdultosTela } from './AdultosTela'
import { ConversaTela } from './ConversaTela'
import { ExercicioTela } from './ExercicioTela'
import { carregarPerfil, salvarPerfil, type PerfilAvatar } from './avatar/perfis'
import { definirPerfilVoz } from './fala/vozLale'
import './App.css'

function App() {
  const [tela, setTela] = useState<'exercicio' | 'adultos' | 'conversa'>('exercicio')
  const [perfil, setPerfil] = useState<PerfilAvatar>(carregarPerfil)

  // Voz sempre coerente com o avatar escolhido
  useEffect(() => {
    definirPerfilVoz(perfil.taxaVoz, perfil.tomFallback)
  }, [perfil])

  const trocarPerfil = (novo: PerfilAvatar) => {
    salvarPerfil(novo.id)
    setPerfil(novo)
  }

  if (tela === 'conversa') {
    return <ConversaTela perfil={perfil} aoVoltar={() => setTela('exercicio')} />
  }

  if (tela === 'adultos') {
    return (
      <AdultosTela
        aoVoltar={() => setTela('exercicio')}
        perfilAtual={perfil}
        aoTrocarPerfil={trocarPerfil}
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
      <ExercicioTela perfil={perfil} />
    </>
  )
}

export default App
