# App mobile (Android via Capacitor)

O frontend web é empacotado como app Android com [Capacitor](https://capacitorjs.com/).
O projeto nativo fica em `frontend/android/` e é versionado (preserva permissões, a
`MainActivity` e as configurações); os artefatos de build são ignorados.

## Pré-requisitos

- **Android Studio + SDK** (neste projeto o SDK está em `E:\androidStudio\Sdk`, com
  Android API 36 e build-tools)
- **JDK 21** (o que vem com o Android Studio, em `E:\androidStudio\jdk\jdk-21.0.11+10`)
- Node 20+

## A questão da rede (importante)

O app roda no celular, mas o **backend e o serviço de fala rodam no seu PC**. Um celular
não enxerga o `localhost` do PC. Duas opções:

1. **Mesma rede Wi-Fi (para testar):** descubra o IP do PC na rede (`ipconfig`, algo como
   `192.168.0.x`) e gere o app apontando para ele. O backend do Spring Boot já aceita
   conexões da rede (bind `0.0.0.0`); pode ser preciso liberar as portas 8081/8090 no
   firewall do Windows.
2. **Backend hospedado (para distribuir):** suba o backend num servidor com HTTPS e aponte
   o app para essa URL.

A URL é definida em tempo de build pela variável `VITE_API_URL`. Sem ela (web/dev), o app
usa caminhos relativos + o proxy do Vite.

## Como gerar o APK

```bash
cd frontend

# 1. Build do web apontando para o backend acessível pelo celular
#    (troque pelo IP do seu PC na rede)
VITE_API_URL=http://192.168.0.10:8081 npm run build

# 2. Copia o web build para o projeto Android
npx cap sync android

# 3. Compila o APK (cache do Gradle vai para o E:, não enche o C:)
cd android
JAVA_HOME="E:\androidStudio\jdk\jdk-21.0.11+10" \
ANDROID_HOME="E:\androidStudio\Sdk" \
GRADLE_USER_HOME="E:\androidStudio\.gradle" \
JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT" \
  ./gradlew assembleDebug
```

O APK sai em `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

### Instalar no celular

- **Por cabo (USB):** com o aparelho em modo desenvolvedor e depuração USB ligada:
  `E:\androidStudio\Sdk\platform-tools\adb.exe install -r app-debug.apk`
- **Sem cabo:** copie o `.apk` para o celular e abra (precisa permitir "instalar de fontes
  desconhecidas").

Também dá para abrir o projeto no Android Studio (`npx cap open android`) e rodar num
emulador ou aparelho pelo botão ▶.

## Notas técnicas

- **Microfone:** a permissão `RECORD_AUDIO` está no manifest e a `MainActivity` a solicita
  na abertura, para o WebView poder gravar (`getUserMedia`) nos exercícios e na conversa.
- **Cleartext HTTP:** liberado no `capacitor.config.ts` para acessar o backend local por
  http durante os testes. Em produção, use https.
- **Voz e avatar rodam no aparelho** (Piper WASM + three.js): não dependem do backend. O que
  precisa do servidor é o catálogo de exercícios, o progresso, a análise (Whisper) e a IA.
- **TLS interceptado:** o `gradle.properties` usa `trustStoreType=WINDOWS-ROOT` para o Gradle
  baixar dependências mesmo com antivírus/proxy interceptando os certificados nesta máquina.
