import { useState } from 'react'
import { AdultosTela } from './AdultosTela'
import { ExercicioTela } from './ExercicioTela'
import './App.css'

function App() {
  const [tela, setTela] = useState<'exercicio' | 'adultos'>('exercicio')

  if (tela === 'adultos') {
    return <AdultosTela aoVoltar={() => setTela('exercicio')} />
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
      <ExercicioTela />
    </>
  )
}

export default App
