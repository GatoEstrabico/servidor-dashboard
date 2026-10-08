# Monitoramento de Laboratorio

Servidor da plataforma: API REST em Fastify, PostgreSQL com Prisma e painel autenticado em Vue 3. O sistema armazena aparelhos e leituras enviados pelo projeto coletor.

Para clonar, configurar e executar todos os componentes, consulte o [guia de instalação](install.md).

## Requisitos

- Node.js 22 ou superior e npm
- PostgreSQL 16 instalado no Windows e iniciado como servico

## Desenvolvimento

1. Instale PostgreSQL para Windows. No instalador, inclua o servidor e o pgAdmin; o PostgreSQL deve estar iniciado como servico do Windows.
2. No Query Tool do pgAdmin, conecte-se ao banco `postgres` como administrador e crie o usuario isolado e o banco da aplicacao. A senha deve corresponder a `DATABASE_URL` no `.env`:

  ```sql
  CREATE USER monitor WITH PASSWORD 'escolha-uma-senha-forte';
  CREATE DATABASE monitoramento OWNER monitor;
  ```

3. O arquivo `.env` local ja esta preparado. Troque `SESSION_SECRET`, `INGESTION_API_KEY`, a senha do usuario `monitor` (atualizando tambem o SQL acima e `DATABASE_URL`) e a senha inicial do administrador antes de expor o sistema fora desta maquina.
4. Instale dependencias com `npm.cmd install`. No PowerShell, use o sufixo `.cmd` se a politica de execucao bloquear o script `npm.ps1`; alternativamente, use Prompt de Comando (cmd).
5. Gere o Prisma Client e crie as tabelas: `npm.cmd run db:generate` e `npm.cmd run db:push`.
6. Crie/atualize o usuario administrador: `npm.cmd run db:seed`.
7. Inicie API e painel: `npm.cmd run dev`.

Painel: http://localhost:5173. API: http://localhost:3000. Em producao, configure HTTPS, `COOKIE_SECURE=true`, origens explicitas e segredos fortes; sirva o build Vue pelo proxy/reverse proxy escolhido.

O Docker Compose incluído é opcional e não é necessário para executar o projeto no Windows.

## Hospedagem publica

- Publique o painel e encaminhe `/api` e `/health` pelo mesmo dominio HTTPS, usando um reverse proxy com certificado valido (por exemplo, ACME/Let's Encrypt) para o Fastify interno na porta 3000.
- Configure `DASHBOARD_ORIGIN` com a origem HTTPS publica do painel e `COOKIE_SECURE=true`. Mantenha `SESSION_SECRET` e `INGESTION_API_KEY` unicos e fortes.
- Exponha publicamente somente HTTPS (porta 443). Nao exponha PostgreSQL nem a porta 3000 diretamente; restrinja o Fastify e o banco a localhost/rede privada do host.
- No ESP32, a aba **Rede** deve apontar para `https://seu-dominio`, sem porta interna. O firmware valida a cadeia usando o bundle de CAs do ESP32 e sincroniza o horario por NTP antes do TLS; a rede do laboratorio precisa permitir DNS, HTTPS de saida e NTP.
- HTTP tambem pode ser selecionado explicitamente na aba Rede, mas exige confirmacao no aparelho e nao criptografa login, token ou leituras. Use somente para testes em uma rede privada confiavel; nunca use HTTP pela internet publica.
- A pagina local do ESP32 ainda e servida por HTTP. Portanto, o passo de digitar a senha do LAB/MONITOR no proprio aparelho deve ser feito em uma rede Wi-Fi confiavel. O trajeto do ESP32 ate a hospedagem publica fica protegido por HTTPS.

## Seguranca e contas

- Senhas sao armazenadas com Argon2id. A sessao e opaca, expira em 12 horas, e seu identificador fica somente em cookie HttpOnly, SameSite=Lax.
- Mutacoes autenticadas exigem token CSRF no header `X-CSRF-Token`; o token e obtido em `GET /api/auth/me`.
- Login tem limite de tentativas. Login e painel aceitam apenas a origem configurada em `DASHBOARD_ORIGIN`.
- A ingestao entre servidores usa `Authorization: Bearer <INGESTION_API_KEY>`, segredo diferente da chave de sessao. Use TLS e rotacione a chave em producao.
- O seed e idempotente para o email configurado. Altere a senha inicial logo apos o primeiro acesso.
- Para habilitar **Esqueci a senha**, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM`. O link expira em 30 minutos e pode ser usado uma vez. Sem SMTP, a API responde de forma generica, mas nao consegue entregar a mensagem.
- O perfil permite alterar nome, e-mail e foto (redimensionada no navegador); essas alteracoes e a troca de senha exigem a senha atual. A redefinicao pelo link encerra todas as sessoes existentes.

## API

Todas as respostas de erro usam `{ "error": "mensagem" }`.

- `POST /api/auth/login` (publico): `{ "email": "...", "password": "..." }`; define cookie de sessao e retorna usuario e CSRF.
- `GET /api/auth/me` (sessao): retorna usuario e token CSRF.
- `POST /api/auth/logout` (sessao + CSRF): encerra a sessao e limpa o cookie.
- `GET /api/devices` (sessao): lista aparelhos e ate cinco leituras recentes por aparelho.
- `GET /api/devices/:id` (sessao): detalhe do aparelho e leituras recentes.
- `POST /api/ingest/devices` (chave de ingestao): registra/atualiza um aparelho e, opcionalmente, adiciona leituras.
- `POST /api/device-links/login` (credenciais do dashboard): cria um token individual para o aparelho.
- `POST /api/device-links/logout` (token do aparelho): revoga o vinculo e marca o aparelho offline.
- `GET /health` (publico): verificacao de disponibilidade.

Na aba **Rede** do ESP32, informe o dominio publico HTTPS do LAB/MONITOR (por exemplo `https://monitor.exemplo.com`) e entre com o e-mail/senha da conta. Nao use localhost, IP privado ou a porta interna 3000 para a hospedagem publica. HTTP pode ser habilitado com confirmacao explicita apenas para testes privados; nesse modo credenciais, token e leituras trafegam sem criptografia. O ESP32 salva um token individual e envia leituras a cada 15 segundos.

### Contrato de ingestao

```json
{
  "externalId": "sensor-sala-01",
  "name": "Sensor da sala 01",
  "location": "Laboratorio / Sala 01",
  "status": "online",
  "readings": [
    { "type": "temperatura", "value": 22.4, "unit": "C", "recordedAt": "2026-09-26T12:30:00.000Z" },
    { "type": "umidade", "value": 48.2, "unit": "%", "recordedAt": "2026-09-26T12:30:00.000Z" }
  ]
}
```

`externalId` identifica o mesmo aparelho entre envios. `status` aceita `online`, `offline` ou `warning`. `readings` pode ser omitido ou conter ate 100 itens por chamada. A API responde `201` com o aparelho atualizado e a quantidade de leituras gravadas. Envie a chave apenas em conexoes TLS e nunca a inclua no frontend.

## Testes

`npm test` executa testes unitarios de validacao do contrato de ingestao.
