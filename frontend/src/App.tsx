import { useEffect, useState } from 'react'
import { AdultosTela } from './AdultosTela'
import { ExercicioTela } from './ExercicioTela'
import { carregarPerfil, salvarPerfil, type PerfilAvatar } from './avatar/perfis'
import { definirPerfilVoz } from './fala/vozLale'
import './App.css'

function App() {
  const [tela, setTela] = useState<'exercicio' | 'adultos'>('exercicio')
  const [perfil, setPerfil] = useState<PerfilAvatar>(carregarPerfil)

  // Voz sempre coerente com o avatar escolhido
  useEffect(() => {
    definirPerfilVoz(perfil.taxaVoz, perfil.tomFallback)
  }, [perfil])

  const trocarPerfil = (novo: PerfilAvatar) => {
    salvarPerfil(novo.id)
    setPerfil(novo)
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
      <ExercicioTela perfil={perfil} />
    </>
  )
}

export default App
