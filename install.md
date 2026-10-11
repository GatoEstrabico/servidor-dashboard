# Instalação e execução

Este guia prepara o ambiente completo do Monitoramento de Laboratório: API Fastify, painel web Vue, banco PostgreSQL e, opcionalmente, o firmware para ESP32.

## 1. Requisitos

Para executar API, painel e banco:

- Git
- Node.js 22 ou superior e npm
- PostgreSQL 16 instalado no Windows e iniciado como serviço


Para compilar e carregar o firmware, além dos itens acima:

- Arduino IDE 2.x
- Placa ESP32 compatível e cabo USB de dados
- Sensor DHT11, módulo de gás MQ-2 e os demais componentes usados na montagem

Para gerar o aplicativo Android:

- Android Studio com Android SDK e JDK compatíveis com a versão do Capacitor
- Um backend acessível pelo celular por HTTPS

## 2. Baixe o projeto

Clone o repositório e entre na pasta criada. Substitua `<URL_DO_REPOSITORIO>` pelo endereço HTTPS ou SSH do GitHub:

```powershell
git clone <URL_DO_REPOSITORIO>
cd servidor
```

Se a pasta tiver outro nome, entre nela em vez de usar `cd servidor`.

## 3. Configure as variáveis de ambiente (`.env`)

Na raiz do projeto, copie o modelo `.env.example` para `.env`:

```powershell
Copy-Item .env.example .env
```

> **Aviso de Segurança:** O arquivo `.env` contém chaves criptográficas e credenciais de acesso. Ele está incluído no `.gitignore` e **nunca** deve ser commitado no repositório Git.

Abra o arquivo `.env` gerado e ajuste suas variáveis conforme as explicações detalhadas abaixo:

---

### Guia Completo das Variáveis do `.env`

#### 💾 Conexão com o Banco de Dados
- **`DATABASE_URL`**: String de conexão padrão do PostgreSQL usada pelo Prisma.
  - Formato: `postgresql://<USUARIO>:<SENHA>@<HOST>:<PORTA>/<BANCO>?schema=public`
  - Exemplo local: `postgresql://monitor:sua_senha@localhost:5432/monitoramento?schema=public`

#### ⚙️ Servidor e Rede
- **`API_PORT`**: Porta TCP em que o servidor Fastify da API vai rodar (padrão: `3000`).
- **`DASHBOARD_ORIGIN`**: Origem autorizada no CORS da API (onde a dashboard está hospedada).
  - Em desenvolvimento local: `http://localhost:5173`
  - Em produção: URL HTTPS oficial da dashboard (ex.: `https://painel.seudominio.com`).
- **`DASHBOARD_PUBLIC_URL`**: Endereço público da dashboard utilizado em links enviados externamente (como links de redefinição de senha por e-mail).
  - Em rede local/testes: `http://localhost:5173` ou `http://<IP-DO-PC>:5173`.
- **`SHOW_WORKSPACE_SETUP_WHEN_EMPTY`**: Se definido como `true`, orienta a exibição das etapas de configuração inicial da área de trabalho quando não há dados cadastrados.

#### 🔐 Segurança e Autenticação
- **`SESSION_SECRET`**: Chave secreta de alta entropia (mínimo de 32 caracteres) usada para assinar cookies e sessões de usuários.
- **`INGESTION_API_KEY`**: Chave de segurança exclusiva (mínimo de 32 caracteres) para autorizar chamadas de ingestão de telemetria.
  
  *Para gerar strings seguras e aleatórias para essas duas variáveis, execute no PowerShell:*
  ```powershell
  node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
  ```
- **`COOKIE_SECURE`**: Define se os cookies de autenticação só trafegam via HTTPS.
  - `false`: Em ambiente de desenvolvimento local (HTTP).
  - `true`: **Obrigatório** em ambiente de produção (HTTPS).

#### 👤 Usuário Administrador Inicial (Seed)
- **`BOOTSTRAP_ADMIN_EMAIL`**: E-mail inicial do administrador do sistema que será criado na execução do comando `db:seed`.
- **`BOOTSTRAP_ADMIN_PASSWORD`**: Senha inicial desse administrador (mínimo de 12 caracteres recomendados).

#### 🪵 Logs e Diagnóstico
- **`API_LOG_LEVEL`**: Nível mínimo de captura de logs do Pino (`fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`). Padrão: `info`.
- **`API_LOG_SERVER`**: Ativa/desativa exibição dos logs do servidor Fastify (`true` ou `false`).
- **`API_LOG_WHATSAPP`**: Ativa/desativa exibição dos logs do serviço do WhatsApp Web / Baileys (`true` ou `false`).
- **`API_LOG_LIBSIGNAL`**: Ativa/desativa logs detalhados da biblioteca criptográfica do WhatsApp LibSignal (`true` ou `false`, padrão: `false` para evitar ruído).
- **`API_LOG_TO_FILE`**: Define se os logs devem ser salvos em disco em arquivo texto (`true` ou `false`).
- **`API_LOG_FILE_PATH`**: Caminho relativo ou absoluto onde o arquivo de log será salvo (padrão: `.data/logs/api.log`).

#### 🔊 Recursos e Sons
- **`ALERT_AUDIO_UPLOAD_ENABLED`**: Permite que usuários autenticados enviem arquivos de áudio para a biblioteca compartilhada de alertas sonoros (`true` ou `false`).

#### 📧 Notificações por E-mail (SMTP - Opcional)
Necessário para recuperação de senhas e envio de alarmes por e-mail:
- **`SMTP_HOST`**: Host do servidor SMTP (ex: `smtp.gmail.com` ou `smtp.office365.com`).
- **`SMTP_PORT`**: Porta do serviço SMTP (geralmente `587` para TLS/STARTTLS ou `465` para SSL).
- **`SMTP_SECURE`**: `false` para porta 587 (STARTTLS), `true` para porta 465 (SSL direto).
- **`SMTP_USER`**: Usuário ou e-mail de autenticação SMTP.
- **`SMTP_PASSWORD`**: Senha da conta ou senha de aplicativo gerada para o SMTP.
- **`SMTP_FROM`**: Remetente exibido nas mensagens (ex: `"LAB/MONITOR <no-reply@exemplo.com>"`).

#### 💬 Notificações por WhatsApp Cloud API da Meta (Opcional)
Utilizado para envio de mensagens oficiais via WhatsApp Business Cloud API:
- **`WHATSAPP_ACCESS_TOKEN`**: Token de acesso emitido no painel de desenvolvedores da Meta.
- **`WHATSAPP_PHONE_NUMBER_ID`**: ID do número de telefone configurado na Cloud API.
- **`WHATSAPP_API_VERSION`**: Versão da Graph API (padrão: `v23.0`).
- **`WHATSAPP_TEMPLATE_NAME`**: Nome do template aprovado (padrão: `lab_monitor_alarm` ou `hello_world` para testes).
- **`WHATSAPP_TEMPLATE_LANGUAGE`**: Código de idioma do template aprovado (padrão: `pt_BR` ou `en_US` para testes).

*(Nota: O projeto também suporta conexão direta de WhatsApp via WhatsApp Web / Baileys autenticado por QR Code no painel).*

---

## 4. Instale as dependências

Na raiz do projeto, instale as dependências gravadas no `package-lock.json`:

```powershell
npm.cmd ci
```

> O sufixo `.cmd` evita restrições de execução de scripts do PowerShell (`npm.ps1`). No Prompt de Comando padrão (CMD), pode-se utilizar apenas `npm ci`.

## 5. Prepare o PostgreSQL

Instale o PostgreSQL 16 para Windows, incluindo o servidor e o pgAdmin. Durante a instalação, defina e guarde a senha do usuário administrador `postgres`; mantenha a porta padrão `5432` e confirme que o serviço do PostgreSQL está iniciado no Windows.

No pgAdmin, conecte-se ao servidor como `postgres`, abra o Query Tool no banco `postgres` e crie um usuário e um banco exclusivos para a aplicação:

```sql
CREATE USER monitor WITH PASSWORD 'escolha-uma-senha-local';
CREATE DATABASE monitoramento OWNER monitor;
```

Substitua `escolha-uma-senha-local` pela senha escolhida. Use exatamente o mesmo usuário, senha, porta e nome de banco na variável `DATABASE_URL` do `.env`. Com o SQL acima, a URL fica assim:

```dotenv
DATABASE_URL="postgresql://monitor:escolha-uma-senha-local@localhost:5432/monitoramento?schema=public"
```

Se a senha tiver caracteres reservados de URL, como `@`, `:`, `/` ou `#`, codifique-os na URL. Para simplificar a configuração local, prefira uma senha forte sem esses caracteres.

## 6. Crie o banco e a conta inicial

Com o PostgreSQL ativo e o `.env` preenchido, execute na raiz:

```powershell
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run db:seed
```

- `db:generate` gera o Prisma Client.
- `db:push` cria ou atualiza as tabelas do banco conforme `apps/api/prisma/schema.prisma`.
- `db:seed` cria ou atualiza a conta definida em `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD`.

Ao atualizar para esta versão, execute `db:generate` e `db:push` para adicionar à tabela de usuários o número de WhatsApp e as preferências dos canais. A mudança preserva os usuários atuais; notificações por e-mail ficam ativadas por padrão e WhatsApp desativado até adesão no perfil.

O seed pode ser executado novamente, mas isso redefine a senha da conta para o valor atual em `.env`.

## 7. Inicie a aplicação

Na raiz do projeto:

```powershell
npm.cmd run dev
```

Esse comando inicia API e painel juntos. Mantenha o terminal aberto enquanto estiver usando o sistema.

- Painel: http://localhost:5173
- API: http://localhost:3000
- Verificação da API: http://localhost:3000/health

Acesse o painel e entre com o e-mail e a senha definidos em `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD`.

Para testar com um aparelho fictício que envia novas leituras a cada 15 segundos, execute `npm.cmd run demo` no lugar de `npm.cmd run dev`. O sensor de demonstração aparece no painel e varia temperatura, umidade e gás. Pressione Ctrl+C para encerrar API, painel e simulador. Se API e painel já estiverem rodando com `npm.cmd run dev`, abra outro terminal e execute `npm.cmd run simulate:device`; pressione Ctrl+C nesse terminal para parar somente o simulador.

Para iniciar os serviços em terminais separados, use a raiz do projeto e execute um comando em cada terminal:

```powershell
npm.cmd run dev -w @monitoramento/api
```

```powershell
npm.cmd run dev -w @monitoramento/dashboard
```

Se a porta 5173 já estiver ocupada, o Vite escolhe outra, como 5174, e informa o endereço no terminal. Feche a instância antiga ou use a porta anunciada.

## 8. Verifique testes e build

Os comandos abaixo também devem ser executados antes de preparar uma publicação:

```powershell
npm.cmd test
npm.cmd run build
```

O build do painel fica em `apps/dashboard/dist`. O build da API é gerado em `apps/api/dist`.

## Android APK

O app Android usa Capacitor para empacotar o mesmo dashboard Vue; o uso no navegador não muda. O APK contém a interface, não a API nem o PostgreSQL. Publique a API em HTTPS antes de instalar o app em outros dispositivos.

Na raiz do projeto, instale as dependências e gere o projeto Android uma única vez:

```powershell
npm.cmd install
npm.cmd run android:add -w @monitoramento/dashboard
```

Configure a origem Android no `.env` da API. Para cookies de sessão entre o WebView e a API HTTPS, use:

```dotenv
ANDROID_APP_ORIGIN="https://localhost"
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
```

No PowerShell, informe a URL HTTPS pública da API e compile o APK de depuração:

```powershell
$env:VITE_API_BASE_URL = "https://api.seu-dominio.com"
npm.cmd run android:build:debug -w @monitoramento/dashboard
```

O arquivo será gerado em `apps/dashboard/android/app/build/outputs/apk/debug/app-debug.apk`. Para abrir o projeto no Android Studio, use `npm.cmd run android:open -w @monitoramento/dashboard`. Builds posteriores podem usar `android:build:debug`, que recompila os arquivos web e sincroniza o projeto nativo antes de compilar.

Quando `VITE_API_BASE_URL` não for definido, o dashboard continua chamando a API na mesma origem, como antes. Não coloque senhas, chaves de sessão ou a chave de ingestão nessa variável nem no app; somente a URL pública da API deve estar no bundle.

## 9. Firmware ESP32 (opcional)

A dashboard Vue/API e a página local hospedada pelo ESP32 são interfaces distintas. O firmware compila os próprios arquivos web em `projeto/web_assets.hpp`.

### Instale o suporte e as bibliotecas

1. Instale o Arduino IDE 2.x.
2. No Boards Manager, instale o pacote de placas ESP32 da Espressif.
3. No Library Manager, instale `ArduinoJson` e `DHT sensor library` (Adafruit). Instale também `Adafruit Unified Sensor` se o Arduino IDE solicitar.
4. As bibliotecas `WiFi` e `WebServer` são fornecidas pelo pacote da placa ESP32.

### Compile e carregue

1. Abra `projeto/projeto.ino` no Arduino IDE.
2. Selecione a placa **ESP32 Dev Module** e a porta serial correta.
3. Mantenha `projeto/partitions.csv` na raiz do sketch e selecione a tabela de partições **Custom** nas opções da placa. Essa tabela reserva 3 MB para o firmware e 960 KB para LittleFS; não selecione **Huge APP**.
4. Compile e carregue o sketch.
5. Abra o Serial Monitor em `115200` baud para acompanhar a inicialização e obter o IP do aparelho.

O firmware usa DHT11 no GPIO 4 e a entrada analógica do MQ-2 no GPIO 34. Confira os demais pinos em `projeto/config.hpp` antes de montar o circuito. GPIOs do ESP32 não são tolerantes a 5 V: limite a tensão analógica do módulo MQ-2 a no máximo 3,3 V antes de conectá-la ao ESP32.

### Configure o Wi-Fi no ESP32

Se ainda não houver uma rede salva, o aparelho inicia o ponto de acesso aberto `MONITOR-CONFIGURAR` por padrão. Conecte o computador ou celular a essa rede e abra o IP de configuração mostrado no Serial Monitor. Escolha a rede Wi-Fi e salve as credenciais. Se um nome personalizado já tiver sido configurado no aparelho, o SSID do ponto de acesso poderá usar esse nome.

Depois de conectado, o painel local do ESP32 fica disponível pelo IP exibido no Serial Monitor. Essa página usa HTTP; configure o aparelho somente em uma rede Wi-Fi confiável.

### Edite os arquivos web do firmware

Se alterar `projeto/web/index.html`, `projeto/web/style.css` ou `projeto/web/script.js`, regenere o cabeçalho antes de compilar e carregar o sketch:

```powershell
Set-Location .\projeto
Set-ExecutionPolicy -Scope Process Bypass
.\generate_web_assets.ps1
```

Volte ao Arduino IDE e carregue o sketch atualizado. O processo normal incorpora os assets no firmware; não é necessário enviar uma imagem LittleFS separadamente.

## 10. Conecte o ESP32 à dashboard

Há dois logins diferentes nesse processo:

- **Login local do ESP32:** protege a interface servida pelo próprio aparelho. Em um firmware sem usuários previamente cadastrados, a conta inicial é `admin` com senha `admin`; altere essa senha na seção **Usuários** assim que entrar.
- **Login LAB/MONITOR:** é o e-mail e a senha da conta criada pelo `npm.cmd run db:seed`. Esses dados são usados somente no formulário **Vincular ao LAB/MONITOR** para autorizar o aparelho no servidor. Não use aqui a senha local do ESP32 nem a senha do Wi-Fi.

### Conecte o aparelho ao Wi-Fi

1. Deixe PostgreSQL, API e dashboard em execução e carregue o firmware no ESP32.
2. Se o aparelho ainda não estiver conectado, conecte-se ao ponto de acesso `MONITOR-CONFIGURAR` e abra o endereço/IP mostrado no Serial Monitor. Entre na interface do ESP32 com o login local.
3. Abra o menu **Rede**, escolha a rede Wi-Fi e use **Salvar e conectar**. Depois que o ESP32 se conectar, o ponto de acesso de configuração será encerrado e o endereço local do aparelho poderá mudar; abra novamente o painel pelo IP informado no Serial Monitor ou pelo endereço `.local` exibido nele.

### Faça o vínculo com o servidor

Na interface local do ESP32, entre novamente com o usuário local, abra **Rede** e preencha o card **Vincular ao LAB/MONITOR**:

1. **Endereço do LAB/MONITOR:** informe a URL base do servidor, sem acrescentar `/api`.
	- Em produção, use o domínio HTTPS público, por exemplo `https://monitor.exemplo.com`.
	- Para teste na mesma rede local, use o endereço IPv4 do computador que executa a API, por exemplo `http://192.168.1.50:3000`. Descubra o IPv4 com `ipconfig`. O ESP32 precisa alcançar esse computador pela rede, e o Firewall do Windows deve permitir conexões privadas de entrada na porta TCP 3000.
	- Não use `localhost`, `127.0.0.1` nem a porta `5173`: `localhost` apontaria para o próprio ESP32 e a porta 5173 é apenas o servidor de desenvolvimento do painel. No teste local, o firmware conversa diretamente com a API na porta 3000.
2. Informe o **e-mail e a senha da conta do painel web**, definidos em `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD` antes do seed (ou a senha atualizada posteriormente no painel).
3. Informe uma localização, se desejar. Para HTTP local, marque a confirmação de segurança exibida; HTTP transmite credenciais e leituras sem criptografia e só deve ser usado em uma rede privada confiável.
4. Selecione **Vincular aparelho**. A mensagem de sucesso confirma que o servidor autenticou a conta e salvou um token exclusivo no ESP32.

Após o vínculo, o firmware envia temperatura, umidade e leitura do sensor de gás aproximadamente a cada 15 segundos. Entre na dashboard web em `http://localhost:5173` (ou no endereço anunciado pelo Vite), usando a conta LAB/MONITOR; o aparelho deverá aparecer na lista. Use **Remover vínculo** na interface do ESP32 para revogá-lo também no servidor.

Em produção, publique API e painel sob o mesmo domínio HTTPS com certificado confiável. O firmware sincroniza a hora por NTP e valida o certificado HTTPS pelo bundle de CAs do ESP32; a rede precisa permitir DNS, NTP e conexões HTTPS de saída.

## 11. Publicação em produção

O procedimento acima é para desenvolvimento. Antes de publicar:

- Use senhas e segredos fortes, aleatórios e exclusivos. Não use os valores de desenvolvimento do `.env.example` ou do Docker Compose.
- Configure `DASHBOARD_ORIGIN` com a origem HTTPS exata do painel e `COOKIE_SECURE=true`.
- Sirva o build do painel por HTTPS e encaminhe `/api` e `/health` pelo mesmo domínio ao Fastify na porta interna 3000.
- Não exponha PostgreSQL nem a porta 3000 diretamente à internet; restrinja o acesso ao proxy e à rede privada do servidor.
- Configure SMTP real se precisar de recuperação de senha por e-mail.
- Use HTTP no ESP32 somente em testes privados e temporários. Para acesso público, use HTTPS.

## Solução de problemas

- **`npm.ps1` bloqueado pelo PowerShell:** use `npm.cmd`, conforme os comandos deste guia, ou execute os comandos no Prompt de Comando.
- **Erro ao conectar ao PostgreSQL:** confirme que o serviço/container está ativo e que usuário, senha, porta e nome do banco em `DATABASE_URL` coincidem.
- **Prisma Client não inicializado:** execute `npm.cmd run db:generate` e reinicie a API.
- **Erro de autenticação no painel:** confira as variáveis `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD`; execute novamente `npm.cmd run db:seed` para redefinir a senha para o valor do `.env`.
- **Porta 5173 ocupada:** encerre o Vite antigo ou abra a porta alternativa informada no terminal.
- **ESP32 não conecta ao Wi-Fi:** apague ou atualize a rede salva pela página de configuração e confira a intensidade do sinal e o tipo de segurança selecionado.
- **`Sketch too big` ou `text section exceeds available space on board`:** no Arduino IDE, confirme a placa **ESP32 Dev Module**, abra **Ferramentas > Partition Scheme > Custom** e mantenha `projeto/partitions.csv` na raiz do sketch `projeto/projeto.ino`. O esquema Custom reserva 3 MB para o programa; o esquema padrão limita o app a cerca de 1,3 MB.
- **ESP32 não chega ao servidor:** use um domínio acessível pelo dispositivo; `localhost` não funciona. Em produção, confira DNS, certificado HTTPS, NTP e encaminhamento de `/api` pelo proxy.
