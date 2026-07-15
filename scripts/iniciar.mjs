// Builda e inicia o Laleo com um comando: npm start (ou duplo clique no
// Iniciar-Laleo.cmd). Faz, nesta ordem:
//   1. instala as dependências do frontend se node_modules não existir
//   2. builda o frontend (tsc + vite) — erros de código aparecem AQUI, antes de subir
//   3. sobe backend (8081) + frontend dev juntos (reusa scripts/dev.mjs)
//   4. espera os dois responderem e abre o navegador na porta certa
// Ctrl+C encerra tudo.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const WIN = process.platform === 'win32'
const NPM = WIN ? 'npm.cmd' : 'npm'

function passo(titulo) {
  console.log(`\n\x1b[1m\x1b[36m▶ ${titulo}\x1b[0m`)
}

function rodar(comando, args, cwd) {
  const r = spawnSync(comando, args, { cwd, stdio: 'inherit', shell: WIN })
  if (r.status !== 0) {
    console.error(`\x1b[31mFalhou: ${comando} ${args.join(' ')}\x1b[0m`)
    process.exit(r.status ?? 1)
  }
}

// 1. Dependências (só quando faltam — reinstalar sempre seria lento)
if (!existsSync(join(RAIZ, 'frontend', 'node_modules'))) {
  passo('Instalando dependências do frontend (primeira vez)')
  rodar(NPM, ['install'], join(RAIZ, 'frontend'))
}

// 2. Build do frontend: o tsc estrito barra erro de tipo antes de subir
passo('Buildando o frontend (typecheck + vite)')
rodar(NPM, ['run', 'build'], join(RAIZ, 'frontend'))

// 3. Sobe backend + frontend (dev.mjs cuida de JDK/Maven/logs prefixados)
passo('Subindo backend (8081) + frontend')
const dev = spawn(process.execPath, [join(RAIZ, 'scripts', 'dev.mjs')], {
  cwd: RAIZ,
  stdio: 'inherit',
})
dev.on('exit', (codigo) => process.exit(codigo ?? 0))
process.on('SIGINT', () => dev.kill())
process.on('SIGTERM', () => dev.kill())

// 4. Espera ficar saudável e abre o navegador na porta que o Vite escolheu
const PORTAS_VITE = [5173, 5174, 5175]

async function responde(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) })
    return res.ok
  } catch {
    return false
  }
}

async function esperarEAbrir() {
  const limite = Date.now() + 180_000
  let urlApp = null
  let backendOk = false
  while (Date.now() < limite) {
    if (!backendOk) backendOk = await responde('http://localhost:8081/api/exercicios')
    if (!urlApp) {
      for (const porta of PORTAS_VITE) {
        if (await responde(`http://localhost:${porta}/`)) {
          urlApp = `http://localhost:${porta}`
          break
        }
      }
    }
    if (backendOk && urlApp) {
      console.log(`\n\x1b[1m\x1b[32m✔ Laleo pronto: ${urlApp}\x1b[0m (backend na 8081)\n`)
      if (WIN) spawn('cmd', ['/c', 'start', '', urlApp], { detached: true, stdio: 'ignore' })
      return
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
  console.log('\x1b[33mAviso: o app não respondeu em 3 min — veja os logs acima.\x1b[0m')
}

void esperarEAbrir()
