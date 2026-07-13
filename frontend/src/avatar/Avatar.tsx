import { useEffect, useRef, type MutableRefObject } from 'react'
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
  /** Chamado quando a criança cutuca o boneco (para reações faladas). */
  aoCutucar?: () => void
  /** Recebe uma função para disparar animações de fora (barra de brincadeiras). */
  comandoRef?: MutableRefObject<((nome: string) => void) | null>
}

/**
 * Animações profissionais em public/animacoes/ (MIT — pixiv/ChatVRM e
 * tk256ailab/vrm-viewer). Clipes de uma vez só voltam ao idle com
 * crossfade suave quando terminam.
 */
const CLIPES: Record<string, string> = {
  idle: '/animacoes/idle.vrma',
  acenar: '/animacoes/acenar.vrma',
  pular: '/animacoes/pular.vrma',
  palmas: '/animacoes/palmas.vrma',
  olhar: '/animacoes/olhar.vrma',
  pensar: '/animacoes/pensar.vrma',
  surpresa: '/animacoes/surpresa.vrma',
  vergonha: '/animacoes/vergonha.vrma',
  soneca: '/animacoes/soneca.vrma',
}
const CLIPES_UMA_VEZ = new Set(['acenar', 'olhar', 'surpresa', 'vergonha'])
const COMEMORACOES = ['pular', 'palmas']
const REACOES_CUTUCAO = ['surpresa', 'vergonha']
const SEGUNDOS_ATE_SONECA = 45

/**
 * O avatar do Laleo: modelo VRM + animações VRMA com transições suaves.
 * Interativo: cutucar o boneco gera reação; muito tempo parado, ele
 * cochila. Boca (lipsync) e piscada continuam procedurais por cima.
 */
export function Avatar({ estado, modelo, getNivelAudio, aoCutucar, comandoRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const estadoRef = useRef<EstadoAvatar>(estado)
  estadoRef.current = estado
  const nivelRef = useRef<(() => number) | undefined>(getNivelAudio)
  nivelRef.current = getNivelAudio
  const cutucarRef = useRef<(() => void) | undefined>(aoCutucar)
  cutucarRef.current = aoCutucar

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
    let umaVezRodando = false
    let comemoracao = 0
    let proximoOlhar = 14
    let ultimaInteracao = 0
    let reacao = 0
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

    /**
     * Troca de animação SEMPRE com crossfade (warp suaviza a diferença de
     * ritmo entre os clipes). umaVez força o clipe a rodar uma única vez
     * e voltar ao idle — o retorno também é suavizado (ver 'finished').
     */
    const tocar = (nome: string, umaVez = false) => {
      const proxima = acoes[nome]
      if (!proxima || nome === acaoAtual) return
      const anterior = acoes[acaoAtual]

      proxima.reset()
      proxima.enabled = true
      proxima.setEffectiveTimeScale(1)
      proxima.setEffectiveWeight(1)
      if (umaVez || CLIPES_UMA_VEZ.has(nome)) {
        proxima.setLoop(THREE.LoopOnce, 1)
        proxima.clampWhenFinished = true
        umaVezRodando = true
      } else {
        proxima.setLoop(THREE.LoopRepeat, Infinity)
        umaVezRodando = false
      }
      proxima.play()

      if (anterior && anterior !== proxima) {
        anterior.crossFadeTo(proxima, 0.45, true)
      } else {
        proxima.fadeIn(0.45)
      }
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
        acao.stop()
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
            if (anim && mixer) {
              const clipe = createVRMAnimationClip(anim, modeloVrm)
              // Trava a raiz no centro horizontal. Cada clipe VRMA (convertido
              // de Mixamo) tem um deslocamento lateral próprio — a idle, por
              // exemplo, fica fixa em X≈0.17. Zerar X e Z de TODOS os quadros
              // (o Y, do pulo, fica) mantém o quadril sempre centrado, então
              // ao trocar de animação o boneco não escorrega para o lado.
              for (const trilha of clipe.tracks) {
                if (trilha.name.endsWith('.position')) {
                  const v = trilha.values
                  for (let i = 0; i < v.length; i += 3) {
                    v[i] = 0
                    v[i + 2] = 0
                  }
                }
              }
              acoes[nome] = mixer.clipAction(clipe)
            }
          } catch {
            console.warn(`Animação ${nome} não carregou (${caminho})`)
          }
        }),
      )
      if (descartado || Object.keys(acoes).length === 0) return

      enquadrar(medirTopoMaximo(modeloVrm, topoRepouso))

      // Fim de clipe de uma vez: volta ao idle com crossfade — nunca
      // congela no último quadro (era a causa do "para do nada")
      mixer!.addEventListener('finished', (evento) => {
        if (descartado) return
        umaVezRodando = false
        const idle = acoes.idle
        const terminada = (evento as unknown as { action: THREE.AnimationAction }).action
        if (!idle || terminada === idle) return
        idle.reset()
        idle.setLoop(THREE.LoopRepeat, Infinity)
        idle.setEffectiveWeight(1)
        idle.play()
        terminada.crossFadeTo(idle, 0.5, true)
        acaoAtual = 'idle'
      })

      // Entrada simpática: acena e depois fica de boa
      tocar(acoes.acenar ? 'acenar' : 'idle')
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

    // Cutucar o boneco: raycast no clique → reação de surpresa/vergonha
    const raycaster = new THREE.Raycaster()
    const ponto = new THREE.Vector2()
    const aoClicar = (evento: PointerEvent) => {
      if (!vrm || !mixer) return
      const area = renderer.domElement.getBoundingClientRect()
      ponto.x = ((evento.clientX - area.left) / area.width) * 2 - 1
      ponto.y = -((evento.clientY - area.top) / area.height) * 2 + 1
      raycaster.setFromCamera(ponto, camera)
      if (raycaster.intersectObject(vrm.scene, true).length === 0) return

      const est = estadoRef.current
      if (est !== 'idle') return // não atrapalha exercício/gravação
      ultimaInteracao = t
      reacao = (reacao + 1) % REACOES_CUTUCAO.length
      const nome = REACOES_CUTUCAO[reacao]
      if (acoes[nome]) {
        tocar(nome)
        cutucarRef.current?.()
      }
    }
    renderer.domElement.addEventListener('pointerdown', aoClicar)

    // Barra de brincadeiras: dispara qualquer clipe uma vez e volta ao idle
    if (comandoRef) {
      comandoRef.current = (nome: string) => {
        if (estadoRef.current !== 'idle' || !acoes[nome]) return
        ultimaInteracao = t
        tocar(nome, true)
      }
    }

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

        if (est !== 'idle') ultimaInteracao = t

        const animando = acaoAtual !== '' && mixer !== null
        if (animando) {
          if (est === 'comemorando') {
            if (!COMEMORACOES.includes(acaoAtual)) {
              comemoracao = (comemoracao + 1) % COMEMORACOES.length
              tocar(acoes[COMEMORACOES[comemoracao]] ? COMEMORACOES[comemoracao] : 'idle')
            }
            setExpressao('happy', 1)
          } else if (est === 'pensando') {
            tocar(acoes.pensar ? 'pensar' : 'idle')
          } else if (!umaVezRodando) {
            // idle / falando / ouvindo — deixa clipes de uma vez terminarem
            if (est === 'idle' && t - ultimaInteracao > SEGUNDOS_ATE_SONECA) {
              tocar(acoes.soneca ? 'soneca' : 'idle')
            } else if (acaoAtual === 'soneca' && t - ultimaInteracao <= SEGUNDOS_ATE_SONECA) {
              tocar('idle') // acordou!
            } else if (acaoAtual !== 'soneca') {
              tocar('idle')
              if (est === 'idle' && t > proximoOlhar) {
                proximoOlhar = t + 14 + Math.random() * 8
                if (acoes.olhar) tocar('olhar')
              }
            }
          }
          mixer!.update(delta)

          if (est === 'ouvindo' && cabeca) {
            // Inclinação aplicada depois do mixer: sobrepõe a animação
            cabeca.rotation.z = 0.14
            cabeca.rotation.x = 0.08
            setExpressao('happy', 0.25)
          }
          if (acaoAtual === 'soneca') {
            setExpressao('blink', 1) // olhinhos fechados dormindo
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
      if (comandoRef) comandoRef.current = null
      cancelAnimationFrame(idAnimacao)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointerdown', aoClicar)
      if (vrm) VRMUtils.deepDispose(vrm.scene)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [modelo, comandoRef])

  return <div ref={containerRef} className="avatar-container" />
}
