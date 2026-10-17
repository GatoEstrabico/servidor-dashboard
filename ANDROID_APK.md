# Tutorial completo: APK Android

Este tutorial prepara o ambiente no Windows ou Linux, configura a URL da API e gera um APK de depuracao. O aplicativo usa o mesmo dashboard Vue do navegador, empacotado pelo Capacitor.

O modo HTTP descrito primeiro serve para testar o APK na rede local. Nesse modo o app carrega o dashboard pelo Vite do PC; o computador precisa ficar ligado e conectado ao mesmo Wi-Fi do celular. Para distribuir o APK sem depender do PC, use o modo de producao HTTPS mais adiante.

## 1. Dependencias

Instale estas ferramentas; nao e necessario abrir o Android Studio para compilar ou assinar:

1. **Node.js 22 ou superior**, que inclui npm.
2. **Android SDK Command-line Tools**, que fornecem `sdkmanager`, `adb`, `apksigner` e `keytool`.
3. **Android SDK Platform 36**, **Platform-Tools** e **Build-Tools**.
4. **JDK 21**. Este projeto usa Gradle 8.14.3 e Android Gradle Plugin 8.13; Java 25 nao funciona com este Gradle.
5. **Git**, se ainda precisar clonar o repositorio.
6. Um celular Android com depuracao USB, somente para instalar e testar. Nao e necessario para gerar o APK.

O projeto esta configurado com `compileSdk 36` e `targetSdk 36`. O SDK e instalado diretamente pela CLI; Android Studio e opcional e nao e usado neste tutorial. A API da aplicacao e o PostgreSQL continuam no servidor, fora do APK.

## 2. Windows: instalar as ferramentas

### 2.1 Node.js

No Windows 10/11 com WinGet, instale Node.js LTS pelo terminal:

```powershell
winget install --id OpenJS.NodeJS.LTS --exact --accept-source-agreements --accept-package-agreements
```

Feche e reabra o PowerShell e confira:

```powershell
node --version
npm.cmd --version
```

Use `npm.cmd` nos comandos abaixo caso a politica do PowerShell bloqueie `npm.ps1`.

### 2.2 Android SDK Command-line Tools

Baixe o pacote oficial e valide o SHA-256 antes de extrair:

```powershell
$SdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$Zip = "$env:TEMP\commandlinetools-win.zip"
$Url = "https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip"
Invoke-WebRequest $Url -OutFile $Zip
$Expected = "90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a"
$Actual = (Get-FileHash $Zip -Algorithm SHA256).Hash.ToLowerInvariant()
if ($Actual -ne $Expected) { throw "SHA-256 invalido para Android Command-line Tools." }
$Extract = "$env:TEMP\android-commandlinetools"
Expand-Archive $Zip -DestinationPath $Extract -Force
New-Item -ItemType Directory -Path "$SdkRoot\cmdline-tools\latest" -Force | Out-Null
Copy-Item "$Extract\cmdline-tools\*" "$SdkRoot\cmdline-tools\latest" -Recurse -Force
```

Configure o SDK e instale as plataformas e ferramentas necessarias. `sdkmanager` pode mostrar um aviso de deprecacao em favor da nova CLI Android; o comando continua disponivel no pacote e e usado aqui para instalacao previsivel:

```powershell
$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot
$env:Path = "$SdkRoot\cmdline-tools\latest\bin;$SdkRoot\platform-tools;$env:Path"
& "$SdkRoot\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root="$SdkRoot" --licenses
& "$SdkRoot\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root="$SdkRoot" "platforms;android-36" "build-tools;35.0.0" "platform-tools"
```

Responda `y` para aceitar cada licenca. Build-Tools 35 e instalado explicitamente porque e a versao selecionada pelo build deste projeto.

### 2.3 JDK 21

Instale um JDK 21, por exemplo o Eclipse Temurin, pelo WinGet:

```powershell
winget install --id EclipseAdoptium.Temurin.21.JDK --exact --accept-source-agreements --accept-package-agreements
```

No PowerShell, defina os caminhos para a sessao atual. Ajuste `JAVA_HOME` se o JDK foi instalado em outra pasta:

```powershell
$env:JAVA_HOME = (Get-ChildItem "$env:ProgramFiles\Eclipse Adoptium" -Directory | Where-Object Name -Like "jdk-21*" | Sort-Object Name -Descending | Select-Object -First 1).FullName
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
java -version
```

O comando `java -version` deve mostrar a versao 21. Para tornar as variaveis permanentes, configure `JAVA_HOME`, `ANDROID_HOME` e o `Path` nas **Variaveis de Ambiente do Windows**; isso e opcional.

## 3. Linux: instalar as ferramentas

Os comandos abaixo sao para Ubuntu/Debian. Em outras distribuicoes, instale os pacotes equivalentes.

### 3.1 Utilitarios e Node.js

Instale os utilitarios usados para baixar e extrair os programas:

```bash
sudo apt update
sudo apt install -y curl git unzip zip
```

Uma opcao para instalar Node.js 22 e usar NVM:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node --version
npm --version
```

### 3.2 Android SDK Command-line Tools

Baixe o pacote oficial Linux, valide o checksum e instale as ferramentas no SDK:

```bash
SDK_ROOT="$HOME/Android/Sdk"
ZIP="${TMPDIR:-/tmp}/commandlinetools-linux.zip"
URL="https://dl.google.com/android/repository/commandlinetools-linux-15859902_latest.zip"
curl -fL "$URL" -o "$ZIP"
echo "4e4c464f145a7512b57d088ac6c278c03c9eea610886b35a5e0804e74eedf583  $ZIP" | sha256sum -c -
TMP_TOOLS="$(mktemp -d)"
unzip -q "$ZIP" -d "$TMP_TOOLS"
mkdir -p "$SDK_ROOT/cmdline-tools/latest"
cp -a "$TMP_TOOLS/cmdline-tools/." "$SDK_ROOT/cmdline-tools/latest/"
```

Defina o ambiente e instale SDK Platform 36, Build-Tools 35 e Platform-Tools:

```bash
export ANDROID_HOME="$SDK_ROOT"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
yes | sdkmanager --sdk_root="$ANDROID_HOME" --licenses
sdkmanager --sdk_root="$ANDROID_HOME" "platforms;android-36" "build-tools;35.0.0" "platform-tools"
```

O SDK Manager pode informar que `sdkmanager` foi depreciado em favor da CLI Android. Ele continua disponivel e esses comandos instalam os pacotes de build solicitados pelo projeto. O caminho padrao do SDK no Linux costuma ser `$HOME/Android/Sdk`.

### 3.3 JDK 21

No Ubuntu 24.04, instale o JDK 21 com:

```bash
sudo apt install -y openjdk-21-jdk
```

Se sua versao do Ubuntu/Debian nao oferecer esse pacote, instale um JDK 21 do [Eclipse Temurin](https://adoptium.net/temurin/releases/?version=21). Configure o ambiente no terminal atual; ajuste `JAVA_HOME` se a distribuicao usar outro caminho:

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
java -version
```

O comando `java -version` deve mostrar a versao 21. Para manter as variaveis entre sessoes, adicione os tres comandos `export` ao `~/.bashrc` e abra um novo terminal.

## 4. Configurar o projeto uma vez

Execute os comandos a partir da raiz do repositorio.

Instale as dependencias JavaScript:

```text
Windows: npm.cmd install
Linux:   npm install
```

O projeto Android ja esta em `apps/dashboard/android`. Se essa pasta nao existir na sua copia, crie a plataforma uma unica vez:

```text
Windows: npm.cmd run android:add -w @monitoramento/dashboard
Linux:   npm run android:add -w @monitoramento/dashboard
```

Nao execute `android:add` novamente se a pasta ja existir.

## 5. Build de teste HTTP na rede local

Este modo e somente para uma rede Wi-Fi privada. O APK abre uma tela para digitar o IP do computador que esta executando o dashboard; o ultimo IP usado fica salvo como sugestao, mas pode ser trocado sempre que o app for aberto. A conexao usa HTTP na porta `5173`, sem precisar configurar `.env.android.local`:

```text
.env.android.example
```

Conteudo do arquivo local:

```dotenv
CAPACITOR_SERVER_URL=http://192.168.1.100:5173
```

O Vite encaminha `/api` para a API no PC, entao mantenha `VITE_API_BASE_URL` sem definir.

No `.env` da API, confira que o CORS inclui o endereco do dashboard e que os cookies estao configurados para desenvolvimento HTTP:

```dotenv
DASHBOARD_PUBLIC_URL="http://192.168.1.100:5173"
COOKIE_SECURE=false
```

O `COOKIE_SAME_SITE` pode ficar no padrao `lax`. Reinicie a API se alterar o `.env`.

Abra um primeiro terminal na raiz e deixe API e dashboard executando:

```text
Windows: npm.cmd run dev
Linux:   npm run dev
```

Em outro terminal, configure `JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT` e `PATH` conforme as secoes do seu sistema operacional e compile:

```text
Windows: npm.cmd run android:build:debug -w @monitoramento/dashboard
Linux:   npm run android:build:debug -w @monitoramento/dashboard
```

O script compila o dashboard, sincroniza o Capacitor e chama o Gradle Wrapper apropriado no Windows ou Linux. O APK fica em:

```text
android/app-debug.apk
```

O app aponta para `http://<IP-digitado>:5173`. O PC precisa continuar ligado, com API e Vite ativos, e o celular deve estar na mesma rede. Libere a porta TCP `5173` no firewall para a rede privada se necessario; nao e preciso expor a porta `3000` ao celular. HTTP nao criptografa credenciais, entao nao use esse APK fora de uma rede de teste confiavel.

Para conferir o acesso antes de instalar o APK, abra `http://<IP-do-PC>:5173` no navegador do celular.

## 6. Instalar no celular ou emulador

Ative **Opcoes do desenvolvedor** e **Depuracao USB** no Android, conecte o cabo e aceite a autorizacao exibida no aparelho. Confirme que o ADB encontrou o dispositivo:

```text
Windows: "%ANDROID_HOME%\platform-tools\adb.exe" devices
Linux:   "$ANDROID_HOME/platform-tools/adb" devices
```

Instale o APK:

```text
Windows: "%ANDROID_HOME%\platform-tools\adb.exe" install -r android/app-debug.apk
Linux:   "$ANDROID_HOME/platform-tools/adb" install -r android/app-debug.apk
```

Tambem pode copiar o APK para o celular e abri-lo. O Android pode solicitar permissao para instalar aplicativos dessa origem. Depois da instalacao, mantenha o servidor de desenvolvimento ativo e teste login, notificacoes, leitura dos aparelhos e uploads.

## 7. APK independente com API HTTPS

Para distribuir ou usar o app sem deixar o dashboard Vite rodando no PC:

1. Publique a API em um endereco HTTPS acessivel ao celular, com certificado confiavel.
2. Crie `.env.production.local` na raiz a partir de `.env.production.example` e configure `VITE_API_BASE_URL` com a origem HTTPS publica da API, sem `/api` no final.
3. No `.env` do servidor, permita a origem Capacitor e cookies seguros: `ANDROID_APP_ORIGIN="https://localhost"`, `COOKIE_SAME_SITE=none` e `COOKIE_SECURE=true`.
4. Crie ou selecione um keystore conforme a proxima secao e execute `android:build:release`.

O arquivo `.env.production.local` na raiz e ignorado pelo Git. O Vite foi configurado para carregar os envs da raiz em builds production. O script release valida que a URL e HTTPS e nao e o dominio de exemplo, desativa `CAPACITOR_SERVER_URL` somente durante essa build e empacota os assets locais. Esse arquivo deve conter apenas a URL publica da API; nunca coloque nele senhas, tokens de sessao, credenciais SMTP ou `INGESTION_API_KEY`.

## 8. Criar keystore pelo terminal

O keystore e a identidade permanente de assinatura do aplicativo. Crie-o fora do repositorio, mantenha uma copia de seguranca protegida e use o mesmo arquivo para todas as atualizacoes. Perder ou trocar a chave impede atualizar instalacoes existentes com a mesma identidade.

Escolha uma senha forte. O `keytool` solicita a senha interativamente, sem inclui-la no comando. Quando perguntar a senha da chave, pressione Enter para reutilizar a senha do keystore.

### Windows PowerShell

```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\.android" -Force | Out-Null
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v -storetype JKS `
	-keystore "$env:USERPROFILE\.android\monitoramento-release.jks" `
	-alias monitoramento-release -keyalg RSA -keysize 2048 -validity 10000
```

### Linux

```bash
mkdir -p "$HOME/.android"
chmod 700 "$HOME/.android"
"$JAVA_HOME/bin/keytool" -genkeypair -v -storetype JKS \
	-keystore "$HOME/.android/monitoramento-release.jks" \
	-alias monitoramento-release -keyalg RSA -keysize 2048 -validity 10000
chmod 600 "$HOME/.android/monitoramento-release.jks"
```

As perguntas sobre nome/organizacao sao os dados do certificado. Nao coloque o keystore, senhas ou dados secretos no repositorio.

## 9. Gerar e assinar release pelo terminal

Confirme primeiro a configuracao de producao descrita na secao 7. O script `android:build:release` ignora a URL de teste de `.env.android.local` para este processo e usa os assets locais do APK.

No `.env` do servidor, use HTTPS e permita a origem Capacitor: `ANDROID_APP_ORIGIN="https://localhost"`, `COOKIE_SAME_SITE=none` e `COOKIE_SECURE=true`. Mantenha `SESSION_SECRET`, senhas, credenciais SMTP e `INGESTION_API_KEY` somente no servidor.

### Windows PowerShell

Abra um novo PowerShell na raiz do repositorio, configure `JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT` e `PATH` conforme a secao 2. Crie o env de producao e informe a URL HTTPS real da API:

```powershell
Copy-Item .env.production.example .env.production.local -Force
$apiUrl = Read-Host "URL HTTPS publica da API, sem /api no final"
if ($apiUrl -notmatch '^https://') { throw "A URL da API precisa usar HTTPS." }
"VITE_API_BASE_URL=$apiUrl" | Set-Content .env.production.local -Encoding ascii
$env:ANDROID_KEYSTORE_PATH = "$env:USERPROFILE\.android\monitoramento-release.jks"
$env:ANDROID_KEY_ALIAS = "monitoramento-release"
$securePassword = Read-Host "Senha do keystore" -AsSecureString
$plainPassword = [System.Net.NetworkCredential]::new("", $securePassword).Password
$env:ANDROID_KEYSTORE_PASSWORD = $plainPassword
$env:ANDROID_KEY_PASSWORD = $plainPassword
npm.cmd run android:build:release -w @monitoramento/dashboard
Remove-Item Env:ANDROID_KEYSTORE_PASSWORD,Env:ANDROID_KEY_PASSWORD -ErrorAction SilentlyContinue
Remove-Variable plainPassword,securePassword -ErrorAction SilentlyContinue
```

### Linux

Abra um novo terminal na raiz do repositorio, configure `JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT` e `PATH` conforme a secao 3. Crie o env de producao e informe a URL HTTPS real da API:

```bash
cp .env.production.example .env.production.local
read -r -p "URL HTTPS publica da API, sem /api no final: " API_URL
[[ "$API_URL" == https://* ]] || { echo "A URL da API precisa usar HTTPS."; exit 1; }
printf 'VITE_API_BASE_URL=%s\n' "$API_URL" > .env.production.local
export ANDROID_KEYSTORE_PATH="$HOME/.android/monitoramento-release.jks"
export ANDROID_KEY_ALIAS="monitoramento-release"
read -r -s -p "Senha do keystore: " ANDROID_KEYSTORE_PASSWORD
printf '\n'
export ANDROID_KEYSTORE_PASSWORD
export ANDROID_KEY_PASSWORD="$ANDROID_KEYSTORE_PASSWORD"
npm run android:build:release -w @monitoramento/dashboard
unset ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_PASSWORD
```

A senha e digitada no prompt e fica apenas nas variaveis do processo atual, nao no historico ou em arquivos do projeto. O script verifica keystore e variaveis antes de chamar Gradle. O APK release assinado sai em:

```text
android/app-release.apk
```

### Verificar assinatura e instalar

No Windows, valide o APK:

```powershell
& "$env:ANDROID_HOME\build-tools\35.0.0\apksigner.bat" verify --verbose --print-certs android/app-release.apk
```

No Linux:

```bash
"$ANDROID_HOME/build-tools/35.0.0/apksigner" verify --verbose --print-certs android/app-release.apk
```

Uma verificacao bem-sucedida termina sem erro e mostra o certificado do assinante. Com o celular conectado e depuracao USB autorizada, instale com `adb install -r android/app-release.apk`. Se houver um APK debug instalado, desinstale-o primeiro: a chave debug e diferente e a desinstalacao apaga os dados locais.

Antes de publicar uma atualizacao, incremente `versionCode` e ajuste `versionName` em `apps/dashboard/android/app/build.gradle`. Preserve o mesmo keystore e alias para que a atualizacao seja aceita nos dispositivos.

## 10. Solucao de problemas

- **`Unsupported class file major version 69`:** o Gradle esta usando Java 25. Configure `JAVA_HOME` para JDK 21 e abra um novo terminal.
- **`JAVA_HOME is not set`:** confira `java -version`, ajuste `JAVA_HOME` e inclua `$JAVA_HOME/bin` (Linux) ou `%JAVA_HOME%\bin` (Windows) no `PATH`.
- **`SDK location not found`:** confirme o caminho do SDK e defina `ANDROID_HOME` e `ANDROID_SDK_ROOT`.
- **`Failed to find target android-36`:** execute `sdkmanager "platforms;android-36" "build-tools;35.0.0" "platform-tools"`.
- **Gradle reclama de caracteres nao ASCII no caminho do projeto:** este projeto ativa `android.overridePathCheck` porque a pasta do Windows pode conter acentos.
- **O APK abre, mas nao carrega o dashboard no modo HTTP:** confirme o IP em `.env.android.local`, reinicie `npm run dev`, conecte celular e PC ao mesmo Wi-Fi e permita a porta `5173` no firewall privado.
- **O APK HTTPS nao autentica:** confirme HTTPS valido, `VITE_API_BASE_URL`, CORS para `ANDROID_APP_ORIGIN`, `COOKIE_SAME_SITE=none` e `COOKIE_SECURE=true`.
- **O release esta sem assinatura ou o script reclama de variaveis:** defina as quatro variaveis `ANDROID_KEYSTORE_*`/`ANDROID_KEY_ALIAS` no mesmo terminal e confira o caminho do arquivo JKS.

## Referencias oficiais

- [Ambiente de desenvolvimento Capacitor 8](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Android SDK Command-line Tools](https://developer.android.com/studio#command-line-tools-only)
- [sdkmanager](https://developer.android.com/tools/sdkmanager)
- [apksigner](https://developer.android.com/tools/apksigner)
- [keytool](https://docs.oracle.com/en/java/javase/21/docs/specs/man/keytool.html)
- [Node.js](https://nodejs.org/)
- [Eclipse Temurin JDK](https://adoptium.net/temurin/releases/?version=21)