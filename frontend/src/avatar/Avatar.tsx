import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm'
import {
  createVRMAnimationClip,
  VRMAnimationLoaderPlugin,
  type VRMAnimation,
} from '@pixiv/three-vrm-animation'
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
 * Animações profissionais em public/animacoes/ (MIT — pixiv/ChatVRM e
 * tk256ailab/vrm-viewer). Clipes de uma vez só (aceno, olhar) voltam ao
 * idle sozinhos; os demais ficam em loop até o estado mudar.
 */
const CLIPES: Record<string, string> = {
  idle: '/animacoes/idle.vrma',
  acenar: '/animacoes/acenar.vrma',
  pular: '/animacoes/pular.vrma',
  palmas: '/animacoes/palmas.vrma',
  olhar: '/animacoes/olhar.vrma',
  pensar: '/animacoes/pensar.vrma',
}
const CLIPES_UMA_VEZ = new Set(['acenar', 'olhar'])
const COMEMORACOES = ['pular', 'palmas']

/**
 * O avatar do Laleo: modelo VRM + animações VRMA com transições suaves.
 * Boca (lipsync pela amplitude do áudio) e piscada continuam procedurais
 * por cima das animações. Sem os arquivos, cai para o movimento
 * procedural; sem o VRM, cai para o boneco primitivo.
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
    let mixer: THREE.AnimationMixer | null = null
    const acoes: Record<string, THREE.AnimationAction> = {}
    let acaoAtual = ''
    let comemoracao = 0
    let proximoOlhar = 14
    let descartado = false

    // O VRM entra dentro deste grupo: o giro para encarar a câmera fica no
    // grupo e o loop de animação nunca o sobrescreve
    const suporte = new THREE.Group()
    cena.add(suporte)
    const GIRO_FRENTE = Math.PI

    const enquadrar = (topoEfetivo: number) => {
      const centro = topoEfetivo - 0.55
      const meiaAltura = topoEfetivo + 0.1 - centro
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

    const tocar = (nome: string) => {
      const proxima = acoes[nome]
      if (!proxima || nome === acaoAtual) return
      const anterior = acoes[acaoAtual]
      proxima.reset()
      if (CLIPES_UMA_VEZ.has(nome)) {
        proxima.setLoop(THREE.LoopOnce, 1)
        proxima.clampWhenFinished = true
      } else {
        proxima.setLoop(THREE.LoopRepeat, Infinity)
      }
      proxima.play()
      if (anterior) anterior.crossFadeTo(proxima, 0.35, false)
      acaoAtual = nome
    }

    /**
     * Mede a altura máxima que a cabeça atinge em todas as animações
     * (o pulo sobe!) para a câmera nunca cortar a cabeça.
     */
    const medirTopoMaximo = (modeloVrm: VRM, topoRepouso: number): number => {
      const cabeca = modeloVrm.humanoid.getNormalizedBoneNode('head')
      if (!cabeca || !mixer) return topoRepouso
      const pos = new THREE.Vector3()
      cabeca.getWorldPosition(pos)
      const folgaCabelo = topoRepouso - pos.y
      let maxCabeca = pos.y
      for (const acao of Object.values(acoes)) {
        mixer.stopAllAction()
        acao.reset().play()
        const duracao = acao.getClip().duration
        for (let tt = 0; tt < duracao; tt += 0.15) {
          mixer.update(0.15)
          cena.updateMatrixWorld(true)
          cabeca.getWorldPosition(pos)
          if (pos.y > maxCabeca) maxCabeca = pos.y
        }
      }
      mixer.stopAllAction()
      return maxCabeca + folgaCabelo
    }

    const carregarAnimacoes = async (modeloVrm: VRM, topoRepouso: number) => {
      const loaderAnim = new GLTFLoader()
      loaderAnim.register((parser) => new VRMAnimationLoaderPlugin(parser))
      mixer = new THREE.AnimationMixer(modeloVrm.scene)

      await Promise.all(
        Object.entries(CLIPES).map(async ([nome, caminho]) => {
          try {
            const gltf = await loaderAnim.loadAsync(caminho)
            const anim = gltf.userData.vrmAnimations?.[0] as VRMAnimation | undefined
            if (anim && mixer) acoes[nome] = mixer.clipAction(createVRMAnimationClip(anim, modeloVrm))
          } catch {
            console.warn(`Animação ${nome} não carregou (${caminho})`)
          }
        }),
      )
      if (descartado || Object.keys(acoes).length === 0) return

      enquadrar(medirTopoMaximo(modeloVrm, topoRepouso))

      // Entrada simpática: acena e depois fica de boa
      tocar(acoes.acenar ? 'acenar' : 'idle')
      mixer!.addEventListener('finished', () => {
        acaoAtual = ''
        tocar('idle')
      })
    }

    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))
    loader
      .loadAsync(modelo)
      .then((gltf) => {
        if (descartado) return
        vrm = gltf.userData.vrm as VRM
        suporte.add(vrm.scene)

        // Pose de repouso caso as animações não carreguem
        bracoEsq = vrm.humanoid.getNormalizedBoneNode('leftUpperArm')
        bracoDir = vrm.humanoid.getNormalizedBoneNode('rightUpperArm')
        if (bracoEsq) bracoEsq.rotation.z = 1.15
        if (bracoDir) bracoDir.rotation.z = -1.15

        const caixa = new THREE.Box3().setFromObject(vrm.scene)
        enquadrar(caixa.max.y + 0.1)
        void carregarAnimacoes(vrm, caixa.max.y)
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
        setExpressao('happy', 0)

        const animando = acaoAtual !== '' && mixer !== null
        if (animando) {
          // Escolhe o clipe pelo estado; comemoração alterna pulo/palmas
          if (est === 'comemorando') {
            if (!COMEMORACOES.includes(acaoAtual)) {
              comemoracao = (comemoracao + 1) % COMEMORACOES.length
              tocar(acoes[COMEMORACOES[comemoracao]] ? COMEMORACOES[comemoracao] : 'idle')
            }
            setExpressao('happy', 1)
          } else if (est === 'pensando') {
            tocar(acoes.pensar ? 'pensar' : 'idle')
          } else if (acaoAtual !== 'acenar' && acaoAtual !== 'olhar') {
            tocar('idle')
            // De vez em quando, olha ao redor curiosa
            if (est === 'idle' && t > proximoOlhar) {
              proximoOlhar = t + 14 + Math.random() * 8
              if (acoes.olhar) tocar('olhar')
            }
          }
          mixer!.update(delta)

          if (est === 'ouvindo' && cabeca) {
            // Inclinação aplicada depois do mixer: sobrepõe a animação
            cabeca.rotation.z = 0.14
            cabeca.rotation.x = 0.08
            setExpressao('happy', 0.25)
          }
        } else {
          // Sem animações: movimento procedural de reserva
          if (cabeca) cabeca.rotation.set(0, 0, 0)
          if (bracoEsq) bracoEsq.rotation.z = 1.15
          if (bracoDir) bracoDir.rotation.z = -1.15
          if (est === 'falando') {
            if (cabeca) cabeca.rotation.x = Math.sin(t * 2.2) * 0.04
          } else if (est === 'ouvindo') {
            if (cabeca) {
              cabeca.rotation.z = 0.14
              cabeca.rotation.x = 0.08
            }
            setExpressao('happy', 0.25)
          } else if (est === 'comemorando') {
            raiz.position.y = Math.abs(Math.sin(t * 5.5)) * 0.06
            const balanco = -0.5 - Math.sin(t * 7) * 0.25
            if (bracoEsq) bracoEsq.rotation.z = balanco
            if (bracoDir) bracoDir.rotation.z = -balanco
            if (cabeca) cabeca.rotation.x = -0.08
            setExpressao('happy', 1)
          } else {
            raiz.rotation.y = GIRO_FRENTE + Math.sin(t * 0.6) * 0.06
            if (cabeca) cabeca.rotation.x = Math.sin(t * 1.4) * 0.02
          }
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
