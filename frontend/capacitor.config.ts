import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.laleo',
  appName: 'Laleo',
  webDir: 'dist',
  // O backend fica fora do app: cleartext liberado para acessar o servidor
  // local (http) na mesma rede durante os testes. Em produção, use https.
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
}

export default config
