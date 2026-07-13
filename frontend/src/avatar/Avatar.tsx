import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm'
import { criarLale, type Lale } from './criarLale'
import type { EstadoAvatar } from '../types'

interface Props {
  estado: EstadoAvatar
  /** Caminho do modelo VRM (ver avatar/perfis.ts). */
  modelo: string
  /** Nível 0–1 do áudio da fala — dirige a boca (lipsync). */
  getNivelAudio?: () => number
}

/**
 * O Lalê em VRM (modelo Vita, CC0) com lipsync dirigido pelo áudio real do
 * TTS e expressões por estado. Se o VRM não carregar, cai para o boneco
 * procedural antigo — o app nunca fica sem avatar.
 */
export function Avatar({ estado, modelo, getNivelAudio }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const estadoRef = useRef<EstadoAvatar>(estado)
  estadoRef.current = estado
  const nivelRef = useRef<(() => number) | undefined>(getNivelAudio)
  nivelRef.current = getNivelAudio

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const cena = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)

    // preserveDrawingBuffer permite capturar o canvas (foto com o Lalê / debug)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const luz = new THREE.DirectionalLight(0xffffff, 2.0)
    luz.position.set(1.5, 2.5, 3)
    cena.add(luz, new THREE.AmbientLight(0xffffff, 1.1))

    let vrm: VRM | null = null
    let fallback: Lale | null = null
    let bracoEsq: THREE.Object3D | null = null
    let bracoDir: THREE.Object3D | null = null
    let descartado = false

    // O VRM entra dentro deste grupo: o giro para encarar a câmera fica no
    // grupo e o loop de animação nunca o sobrescreve
    const suporte = new THREE.Group()
    cena.add(suporte)
    const GIRO_FRENTE = Math.PI

    // Enquadra pela caixa real do modelo, com folga em cima para o cabelo
    // e para o pulo da comemoração — a cabeça nunca sai da tela
    const FOLGA_TOPO = 0.2
    const enquadrar = (modelo3d: THREE.Object3D) => {
      const caixa = new THREE.Box3().setFromObject(modelo3d)
      const topo = caixa.max.y
      const centro = topo - 0.45
      const meiaAltura = topo + FOLGA_TOPO - centro
      const distancia = meiaAltura / Math.tan(((camera.fov / 2) * Math.PI) / 180)
      camera.position.set(0, centro + 0.05, distancia)
      camera.lookAt(0, centro, 0)
    }

    const usarFallback = () => {
      fallback = criarLale()
      cena.add(fallback.raiz)
      camera.position.set(0, 0.2, 4.2)
      camera.lookAt(0, 0, 0)
    }

    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))
    loader
      .loadAsync(modelo)
      .then((gltf) => {
        if (descartado) return
        vrm = gltf.userData.vrm as VRM
        suporte.add(vrm.scene)

        // Sai da T-pose: braços relaxados (a pose é reaplicada no loop,
        // porque a comemoração os anima)
        bracoEsq = vrm.humanoid.getNormalizedBoneNode('leftUpperArm')
        bracoDir = vrm.humanoid.getNormalizedBoneNode('rightUpperArm')
        if (bracoEsq) bracoEsq.rotation.z = 1.15
        if (bracoDir) bracoDir.rotation.z = -1.15

        enquadrar(vrm.scene)
      })
      .catch((e) => {
        console.warn('VRM não carregou, usando avatar procedural:', e)
        if (!descartado) usarFallback()
      })

    const redimensionar = () => {
      const { clientWidth: w, clientHeight: h } = container
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    redimensionar()
    const observer = new ResizeObserver(redimensionar)
    observer.observe(container)

    const setExpressao = (nome: string, valor: number) => {
      vrm?.expressionManager?.setValue(nome, valor)
    }

    const relogio = new THREE.Clock()
    let t = 0
    let bocaSuave = 0
    let idAnimacao = 0

    const animar = () => {
      idAnimacao = requestAnimationFrame(animar)
      const delta = relogio.getDelta()
      t += delta
      const est = estadoRef.current

      if (vrm) {
        const raiz = suporte
        const cabeca = vrm.humanoid.getNormalizedBoneNode('head')

        // Boca: amplitude real do áudio quando disponível; senão ritmo sintético
        const nivelBruto = nivelRef.current?.() ?? 0
        const alvoBoca =
          est === 'falando'
            ? nivelBruto > 0
              ? nivelBruto
              : Math.abs(Math.sin(t * 10)) * 0.6
            : 0
        bocaSuave += (alvoBoca - bocaSuave) * 0.4
        setExpressao('aa', bocaSuave)

        // Piscada periódica (fecha rápido a cada ~3s)
        const fasePiscada = t % 3.2
        setExpressao('blink', fasePiscada > 3.0 ? Math.sin(((fasePiscada - 3.0) / 0.2) * Math.PI) : 0)

        raiz.position.y = 0
        raiz.rotation.set(0, GIRO_FRENTE, 0)
        if (cabeca) cabeca.rotation.set(0, 0, 0)
        // Braços relaxados por padrão; a comemoração os levanta
        if (bracoEsq) bracoEsq.rotation.z = 1.15
        if (bracoDir) bracoDir.rotation.z = -1.15
        setExpressao('happy', 0)

        if (est === 'falando') {
          if (cabeca) cabeca.rotation.x = Math.sin(t * 2.2) * 0.04
        } else if (est === 'ouvindo') {
          if (cabeca) {
            cabeca.rotation.z = 0.14
            cabeca.rotation.x = 0.08
          }
          setExpressao('happy', 0.25)
        } else if (est === 'comemorando') {
          // Pulinho contido (a folga do enquadramento cobre a amplitude)
          raiz.position.y = Math.abs(Math.sin(t * 5.5)) * 0.06
          raiz.rotation.y = GIRO_FRENTE + Math.sin(t * 3) * 0.08
          // Braços para cima balançando: comemoração de verdade
          const balanco = 0.55 + Math.sin(t * 7) * 0.25
          if (bracoEsq) bracoEsq.rotation.z = balanco
          if (bracoDir) bracoDir.rotation.z = -balanco
          if (cabeca) cabeca.rotation.x = -0.08
          setExpressao('happy', 1)
        } else {
          raiz.rotation.y = GIRO_FRENTE + Math.sin(t * 0.6) * 0.06
          if (cabeca) cabeca.rotation.x = Math.sin(t * 1.4) * 0.02
        }

        vrm.update(delta)
      } else if (fallback) {
        // Animação do boneco procedural (comportamento antigo)
        fallback.raiz.position.y = Math.sin(t * 1.6) * 0.06
        if (est === 'falando') {
          fallback.boca.scale.y = 0.35 + Math.abs(Math.sin(t * 12)) * 0.5
        } else if (est === 'ouvindo') {
          fallback.orelhaEsq.scale.setScalar(1 + Math.sin(t * 6) * 0.12)
          fallback.orelhaDir.scale.setScalar(1 + Math.sin(t * 6 + 1) * 0.12)
        } else if (est === 'comemorando') {
          fallback.raiz.position.y = Math.abs(Math.sin(t * 6)) * 0.45
          fallback.boca.scale.y = 0.8
        } else {
          fallback.boca.scale.y = 0.35
          fallback.raiz.rotation.y = Math.sin(t * 0.7) * 0.15
        }
      }

      renderer.render(cena, camera)
    }
    animar()

    return () => {
      descartado = true
      cancelAnimationFrame(idAnimacao)
      observer.disconnect()
      if (vrm) VRMUtils.deepDispose(vrm.scene)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [modelo])

  return <div ref={containerRef} className="avatar-container" />
}
