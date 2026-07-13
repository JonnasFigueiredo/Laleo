import * as THREE from 'three'

/**
 * O Lalê: avatar 3D procedural (primitivas three.js) usado até termos um
 * modelo VRM definitivo. A hierarquia expõe as partes que animamos:
 * boca (fala), corpo (pulo de comemoração) e orelhas (escuta).
 */
export interface Lale {
  raiz: THREE.Group
  boca: THREE.Mesh
  olhoEsq: THREE.Mesh
  olhoDir: THREE.Mesh
  orelhaEsq: THREE.Mesh
  orelhaDir: THREE.Mesh
}

const COR_CORPO = 0x7c5cff
const COR_BARRIGA = 0xb3a1ff
const COR_OLHO = 0x2b2b2b

export function criarLale(): Lale {
  const raiz = new THREE.Group()

  const corpo = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshStandardMaterial({ color: COR_CORPO, roughness: 0.6 }),
  )
  corpo.scale.set(1, 1.15, 0.95)
  raiz.add(corpo)

  const barriga = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 32, 32),
    new THREE.MeshStandardMaterial({ color: COR_BARRIGA, roughness: 0.7 }),
  )
  barriga.position.set(0, -0.25, 0.5)
  barriga.scale.set(1, 1.1, 0.6)
  raiz.add(barriga)

  const geoOlho = new THREE.SphereGeometry(0.11, 16, 16)
  const matOlho = new THREE.MeshStandardMaterial({ color: COR_OLHO })
  const olhoEsq = new THREE.Mesh(geoOlho, matOlho)
  olhoEsq.position.set(-0.3, 0.35, 0.85)
  const olhoDir = olhoEsq.clone()
  olhoDir.position.x = 0.3
  raiz.add(olhoEsq, olhoDir)

  // Boca: esfera achatada que escala no eixo Y conforme o avatar "fala"
  const boca = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x3d2b56 }),
  )
  boca.position.set(0, 0.02, 0.9)
  boca.scale.set(1, 0.35, 0.4)
  raiz.add(boca)

  const geoOrelha = new THREE.ConeGeometry(0.22, 0.55, 16)
  const matOrelha = new THREE.MeshStandardMaterial({ color: COR_CORPO, roughness: 0.6 })
  const orelhaEsq = new THREE.Mesh(geoOrelha, matOrelha)
  orelhaEsq.position.set(-0.55, 1.05, 0)
  orelhaEsq.rotation.z = 0.35
  const orelhaDir = new THREE.Mesh(geoOrelha, matOrelha)
  orelhaDir.position.set(0.55, 1.05, 0)
  orelhaDir.rotation.z = -0.35
  raiz.add(orelhaEsq, orelhaDir)

  const geoPe = new THREE.SphereGeometry(0.28, 16, 16)
  const matPe = new THREE.MeshStandardMaterial({ color: COR_BARRIGA, roughness: 0.8 })
  const peEsq = new THREE.Mesh(geoPe, matPe)
  peEsq.position.set(-0.42, -1.15, 0.25)
  peEsq.scale.set(1, 0.5, 1.3)
  const peDir = peEsq.clone()
  peDir.position.x = 0.42
  raiz.add(peEsq, peDir)

  return { raiz, boca, olhoEsq, olhoDir, orelhaEsq, orelhaDir }
}
