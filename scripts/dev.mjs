// Sobe o backend (Spring Boot, porta 8081) e o frontend (Vite) juntos, com os
// logs de cada um prefixados e coloridos. Encerrar com Ctrl+C derruba os dois.
//
//   node scripts/dev.mjs      (ou: npm run dev)
//
// Sem dependências externas — usa só o Node, que o frontend já exige.
import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const WIN = process.platform === 'win32'

// Maven: prefere o embutido em tools/ (evita depender de instalação global)
const mvnEmbutido = join(RAIZ, 'tools', 'apache-maven-3.9.16', 'bin', WIN ? 'mvn.cmd' : 'mvn')
const mvn = existsSync(mvnEmbutido) ? mvnEmbutido : WIN ? 'mvn.cmd' : 'mvn'

// JDK 17: usa JAVA_HOME se definido; senão tenta achar em locais comuns no Windows
function acharJavaHome() {
  if (process.env.JAVA_HOME) return process.env.JAVA_HOME
  if (!WIN) return undefined
  const bases = ['C:\\Program Files\\Java', 'C:\\Program Files\\Eclipse Adoptium']
  for (const base of bases) {
    if (!existsSync(base)) continue
    const jdk = readdirSync(base).find((d) => /jdk-?17/i.test(d))
    if (jdk) return join(base, jdk)
  }
  return undefined
}
const javaHome = acharJavaHome()

const processos = []
let encerrando = false

function encerrar(codigo = 0) {
  if (encerrando) return
  encerrando = true
  for (const p of processos) {
    try {
      p.kill()
    } catch {
      /* ignora */
    }
  }
  process.exit(codigo)
}
process.on('SIGINT', () => encerrar(0))
process.on('SIGTERM', () => encerrar(0))

function subir(nome, cor, comando, args, cwd, envExtra = {}) {
  const proc = spawn(comando, args, {
    cwd,
    shell: WIN, // .cmd (mvn/npm) precisa de shell no Windows
    env: { ...process.env, ...envExtra },
  })
  const prefixo = `\x1b[${cor}m[${nome}]\x1b[0m `
  const repassar = (fluxo, destino) => {
    let resto = ''
    fluxo.setEncoding('utf8')
    fluxo.on('data', (bloco) => {
      const linhas = (resto + bloco).split('\n')
      resto = linhas.pop() ?? ''
      for (const linha of linhas) destino.write(prefixo + linha + '\n')
    })
  }
  repassar(proc.stdout, process.stdout)
  repassar(proc.stderr, process.stderr)
  proc.on('exit', (codigo) => {
    process.stdout.write(prefixo + `encerrou (código ${codigo})\n`)
    encerrar(codigo ?? 0)
  })
  processos.push(proc)
}

// TLS interceptado (antivírus/proxy) no Windows: confia na store do sistema
const envBackend = {}
if (javaHome) envBackend.JAVA_HOME = javaHome
if (WIN && !process.env.MAVEN_OPTS)
  envBackend.MAVEN_OPTS = '-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT'

console.log('Iniciando Laleo — backend (8081) + frontend (Vite). Ctrl+C encerra os dois.\n')
if (WIN && !javaHome)
  console.log('Aviso: JAVA_HOME não encontrado; defina-o se o backend não subir.\n')

subir('backend', '36', mvn, ['-q', 'spring-boot:run'], join(RAIZ, 'backend'), envBackend)
subir('frontend', '35', WIN ? 'npm.cmd' : 'npm', ['run', 'dev'], join(RAIZ, 'frontend'))
