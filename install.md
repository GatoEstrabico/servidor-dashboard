# Instalação e execução

Este guia prepara o ambiente completo do Monitoramento de Laboratório: API Fastify, painel web Vue, banco PostgreSQL e, opcionalmente, o firmware para ESP32.

## 1. Requisitos

Para executar API, painel e banco:

- Git
- Node.js 22 ou superior e npm
- PostgreSQL 16 instalado no Windows e iniciado como serviço
- Windows PowerShell ou Prompt de Comando (os comandos abaixo usam PowerShell)

Para compilar e carregar o firmware, além dos itens acima:

- Arduino IDE 2.x
- Placa ESP32 compatível e cabo USB de dados
- Sensor DHT11, módulo de gás MQ-2 e os demais componentes usados na montagem

## 2. Baixe o projeto

Clone o repositório e entre na pasta criada. Substitua `<URL_DO_REPOSITORIO>` pelo endereço HTTPS ou SSH do GitHub:

```powershell
git clone <URL_DO_REPOSITORIO>
cd servidor
```

Se a pasta tiver outro nome, entre nela em vez de usar `cd servidor`.

## 3. Instale as dependências e configure o ambiente

Na raiz do projeto, crie o arquivo local de configuração a partir do exemplo e instale as dependências travadas no `package-lock.json`:

```powershell
Copy-Item .env.example .env
npm.cmd ci
```

O sufixo `.cmd` evita o bloqueio do `npm.ps1` em algumas configurações do PowerShell. No Prompt de Comando, use `npm` no lugar de `npm.cmd`.

Abra `.env` e revise estas variáveis antes de iniciar:

| Variável | Desenvolvimento local |
| --- | --- |
| `DATABASE_URL` | URL do PostgreSQL instalado localmente; ajuste usuário, senha e banco conforme a configuração abaixo |
| `API_PORT` | `3000` |
| `DASHBOARD_ORIGIN` | `http://localhost:5173` |
| `SESSION_SECRET` | Segredo aleatório exclusivo, com pelo menos 32 caracteres |
| `INGESTION_API_KEY` | Outro segredo aleatório exclusivo, com pelo menos 32 caracteres |
| `COOKIE_SECURE` | `false` somente para desenvolvimento local por HTTP |
| `BOOTSTRAP_ADMIN_EMAIL` | E-mail da conta que será criada pelo seed |
| `BOOTSTRAP_ADMIN_PASSWORD` | Senha inicial com pelo menos 12 caracteres |

Gere um valor aleatório para cada segredo, sem reutilizar o mesmo valor:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Substitua os valores de exemplo de `SESSION_SECRET` e `INGESTION_API_KEY` pelo resultado de duas execuções separadas. Nunca publique o `.env`: ele está excluído pelo `.gitignore`.

As variáveis `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM` são opcionais. Configure-as com credenciais reais para habilitar links de redefinição de senha e notificações de alarmes por e-mail.

Para notificações por WhatsApp, configure estas variáveis opcionais com as credenciais do app da Meta Cloud API (mantenha os tokens somente no `.env` do servidor):

| Variável | Uso |
| --- | --- |
| `WHATSAPP_ACCESS_TOKEN` | Token de acesso permanente/servidor da Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número de telefone habilitado para Cloud API |
| `WHATSAPP_API_VERSION` | Versão Graph API; padrão `v23.0` |
| `WHATSAPP_TEMPLATE_NAME` | Nome do modelo aprovado; padrão `lab_monitor_alarm` |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Idioma aprovado do modelo; padrão `pt_BR` |

Configure ambas `WHATSAPP_ACCESS_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID` ou deixe ambas vazias. No WhatsApp Manager, crie e aprove um modelo da categoria Utility com idioma `pt_BR` e este corpo, que corresponde aos três parâmetros enviados pela API:

```text
Alerta de monitoramento: {{1}} está {{2}}. Localização: {{3}}.
```

Cada pessoa informa o telefone internacional (E.164, como `+5521999999999`) e ativa o canal no perfil. Alertas de e-mail usam o endereço da conta e também podem ser desativados pelo perfil. A Cloud API oficial não requer um intermediário pago, mas a Meta pode aplicar preços e limites conforme a conta, o país e a política vigente.

## 4. Prepare o PostgreSQL

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

Se a senha tiver caracteres reservados de URL, como `@`, `:`, `/` ou `#`, codifique-os na URL. Para simplificar a configuração local, prefira uma senha forte sem esses caracteres. O PostgreSQL é executado diretamente como serviço do Windows; o Docker Compose do repositório não é necessário.

## 5. Crie o banco e a conta inicial

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

## 6. Inicie a aplicação

Na raiz do projeto:

```powershell
npm.cmd run dev
```

Esse comando inicia API e painel juntos. Mantenha o terminal aberto enquanto estiver usando o sistema.

- Painel: http://localhost:5173
- API: http://localhost:3000
- Verificação da API: http://localhost:3000/health

Acesse o painel e entre com o e-mail e a senha definidos em `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD`.

Para testar com um aparelho ficticio que envia novas leituras a cada 15 segundos, execute `npm.cmd run demo` no lugar de `npm.cmd run dev`. O sensor de demonstracao aparece no painel e varia temperatura, umidade e gas. Pressione Ctrl+C para encerrar API, painel e simulador. Se API e painel ja estiverem rodando com `npm.cmd run dev`, abra outro terminal e execute `npm.cmd run simulate:device`; pressione Ctrl+C nesse terminal para parar somente o simulador.

Para iniciar os serviços em terminais separados, use a raiz do projeto e execute um comando em cada terminal:

```powershell
npm.cmd run dev -w @monitoramento/api
```

```powershell
npm.cmd run dev -w @monitoramento/dashboard
```

Se a porta 5173 já estiver ocupada, o Vite escolhe outra, como 5174, e informa o endereço no terminal. Feche a instância antiga ou use a porta anunciada.

## 7. Verifique testes e build

Os comandos abaixo também devem ser executados antes de preparar uma publicação:

```powershell
npm.cmd test
npm.cmd run build
```

O build do painel fica em `apps/dashboard/dist`. O build da API é gerado em `apps/api/dist`.

## 8. Firmware ESP32 (opcional)

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

## 9. Vincule o ESP32 ao servidor web

O vínculo do aparelho com a plataforma é opcional. Para uso real, publique API e painel sob o mesmo domínio HTTPS com certificado confiável. Na aba **Rede** do painel local do ESP32:

1. Informe a URL pública HTTPS do sistema, o e-mail e a senha da conta do painel e, se desejar, a localização.
2. Selecione **Vincular aparelho**. O servidor cria um token exclusivo para esse ESP32; o dispositivo envia as leituras periodicamente.
3. Para desvincular, use **Remover vínculo** no aparelho.

Não configure `localhost` no ESP32: esse nome apontaria para o próprio dispositivo, não para o computador servidor. Testes HTTP só devem ocorrer em uma rede privada confiável, com a opção de HTTP confirmada no aparelho. HTTP não protege senha, token ou leituras.

O firmware usa sincronização de horário por NTP e valida certificados HTTPS pelo bundle de CAs do ESP32. A rede precisa permitir DNS, NTP e conexões HTTPS de saída.

## 10. Publicação em produção

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
- **ESP32 não chega ao servidor:** use um domínio acessível pelo dispositivo; `localhost` não funciona. Em produção, confira DNS, certificado HTTPS, NTP e encaminhamento de `/api` pelo proxy.
