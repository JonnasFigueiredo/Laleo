import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { criarLale } from './criarLale'
import type { EstadoAvatar } from '../types'

interface Props {
  estado: EstadoAvatar
}

/**
 * Cena three.js com o Lalê. O estado controla a animação:
 * - idle: flutua devagar e pisca
 * - falando: boca abre/fecha no ritmo da fala
 * - ouvindo: orelhas crescem e ele se inclina para frente
 * - comemorando: pula e gira
 */
export function Avatar({ estado }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const estadoRef = useRef<EstadoAvatar>(estado)
  estadoRef.current = estado

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const cena = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
    camera.position.set(0, 0.2, 4.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const luz = new THREE.DirectionalLight(0xffffff, 2.2)
    luz.position.set(2, 3, 4)
    cena.add(luz, new THREE.AmbientLight(0xffffff, 0.9))

    const lale = criarLale()
    cena.add(lale.raiz)

    const redimensionar = () => {
      const { clientWidth: w, clientHeight: h } = container
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    redimensionar()
    const observer = new ResizeObserver(redimensionar)
    observer.observe(container)

    let quadro = 0
    let idAnimacao = 0
    const animar = () => {
      idAnimacao = requestAnimationFrame(animar)
      quadro += 1
      const t = quadro / 60

      // Respiração/flutuação base em todos os estados
      lale.raiz.position.y = Math.sin(t * 1.6) * 0.06

      const est = estadoRef.current
      if (est === 'falando') {
        lale.boca.scale.y = 0.35 + Math.abs(Math.sin(t * 12)) * 0.5
        lale.raiz.rotation.y = Math.sin(t * 2) * 0.08
        lale.raiz.rotation.z = 0
      } else if (est === 'ouvindo') {
        lale.boca.scale.y = 0.25
        lale.orelhaEsq.scale.setScalar(1 + Math.sin(t * 6) * 0.12)
        lale.orelhaDir.scale.setScalar(1 + Math.sin(t * 6 + 1) * 0.12)
        lale.raiz.rotation.x = 0.12
        lale.raiz.rotation.z = 0
      } else if (est === 'comemorando') {
        lale.raiz.position.y = Math.abs(Math.sin(t * 6)) * 0.45
        lale.raiz.rotation.z = Math.sin(t * 8) * 0.18
        lale.boca.scale.y = 0.8
      } else {
        // idle: piscada ocasional
        lale.boca.scale.y = 0.35
        lale.raiz.rotation.x = 0
        lale.raiz.rotation.z = 0
        lale.raiz.rotation.y = Math.sin(t * 0.7) * 0.15
        const piscar = Math.sin(t * 2.5) > 0.97 ? 0.15 : 1
        lale.olhoEsq.scale.y = piscar
        lale.olhoDir.scale.y = piscar
        lale.orelhaEsq.scale.setScalar(1)
        lale.orelhaDir.scale.setScalar(1)
      }

      renderer.render(cena, camera)
    }
    animar()

    return () => {
      cancelAnimationFrame(idAnimacao)
      observer.disconnect()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={containerRef} className="avatar-container" />
}
