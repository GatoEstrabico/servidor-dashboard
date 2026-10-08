# Projeto Monitoramento de Laboratório (C++/Arduino)

Este projeto foi adaptado do código original em MicroPython para C++/Arduino.

## Estrutura

- `main.cpp` / `main.ino`: ponto de entrada do firmware
- `*.cpp` e `*.hpp`: módulos da aplicação
- `config.hpp`: pinos e constantes do sistema

## Bibliotecas necessárias no Arduino IDE

- WiFi
- WebServer
- ArduinoJson
- DHT sensor library

## Configuração do Arduino IDE

1. Abra o Arduino IDE.
2. Selecione a placa: `ESP32 Dev Module`.
3. Certifique-se de que a porta COM correta está selecionada.
4. Abra a pasta do projeto como pasta do sketch.
5. Mantenha o arquivo `partitions.csv` na raiz do sketch.
6. Compile e faça upload.

Depois do upload, o ESP32 tenta conectar automaticamente à rede Wi-Fi salva na memória interna. Se não houver nenhuma rede configurada, ele inicia um ponto de acesso de configuração chamado `MONITOR-CONFIGURAR` por padrão. Conecte seu celular nesse AP, abra a página de configuração e escolha a rede Wi‑Fi desejada. Após salvar a rede, o ESP32 para de transmitir o AP e passa a conectar-se automaticamente à rede escolhida em todas as inicializações.

## Dashboard web

Os arquivos da interface ficam em `web/index.html`, `web/style.css` e `web/script.js`. A pasta `data` também contém uma cópia para uso no LittleFS quando necessário.

Ao abrir o IP do ESP32, o painel exibe o status dos sensores sem qualquer tela de login. A página principal mostra temperatura, umidade, gás e o estado da rede. A configuração do Wi‑Fi é feita pela tela de setup iniciada em AP quando não há credencial salva.

O arquivo `partitions.csv` reserva 3 MB para o aplicativo e 960 KB para o LittleFS. Na Arduino IDE, selecione a tabela de partições `Custom` para usar esse arquivo; a tabela padrão não comporta o firmware com os assets web. Nao selecione `Huge APP`, pois ela substitui a partição LittleFS customizada.

## Editar e enviar a interface web

Os arquivos editáveis do dashboard ficam separados em:

- `web/index.html`: estrutura das páginas e textos
- `web/style.css`: estilos visuais
- `web/script.js`: comportamento e chamadas da API
- `logo.jpg`: logo exibido no dashboard

Depois de editar qualquer arquivo web, abra o PowerShell na pasta do projeto e execute:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\generate_web_assets.ps1
```

Esse comando gera `web_assets.hpp`, que compila o HTML, CSS, JavaScript e logo dentro do firmware. Em seguida, basta clicar em **Carregar** no Arduino IDE. Não é necessário executar `upload_littlefs.ps1` nem fazer um segundo upload.

O arquivo `webserver.cpp` apenas registra as rotas `/`, `/style.css`, `/script.js` e `/logo.jpg`; o conteúdo dessas rotas vem do `web_assets.hpp` gerado.

### Vincular ao dashboard LAB/MONITOR deste workspace

1. Publique a API e o painel sob um dominio HTTPS com certificado confiavel e conecte o ESP32 a uma rede Wi-Fi com acesso a internet.
2. Na aba **Rede** do ESP32, informe `https://seu-dominio`, o e-mail/senha da conta LAB/MONITOR e, opcionalmente, a localizacao. Nao use localhost, IP privado nem a porta interna da API para producao. HTTP pode ser habilitado com uma confirmacao explicita somente em rede privada confiavel.
3. Clique em **Vincular aparelho**. O servidor identifica a unidade pelo MAC Wi-Fi, devolve um token individual e a partir dai o ESP32 publica temperatura, umidade e leitura ADC de gas a cada 15 segundos.
4. Use **Remover vinculo** para revogar o token no servidor e apaga-lo da memoria do ESP32.

O ESP32 exige que o nome configurado em Sensores nao esteja vazio para usar um nome personalizado; caso contrario, sera usado um nome baseado no MAC. Em HTTPS, o firmware valida certificados com o bundle de CAs do ESP32 e sincroniza o relogio via NTP. O servidor deve terminar TLS no reverse proxy e encaminhar `/api` para o Fastify. HTTP nao cifra senha, token ou leituras e deve ficar restrito a testes privados. A pagina local do ESP32 ainda usa HTTP, entao vincule o aparelho apenas em uma rede Wi-Fi confiavel.

Depois de editar `web/index.html`, `web/style.css` ou `web/script.js`, gere novamente o header embarcado antes de compilar:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\generate_web_assets.ps1
```
