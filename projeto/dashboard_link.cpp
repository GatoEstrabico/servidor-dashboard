#include "dashboard_link.hpp"

#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <NetworkClientSecure.h>
#include <WiFi.h>
#include <time.h>
#include "storage.hpp"

namespace {
  constexpr unsigned long kUploadIntervalMs = 15000UL;
  unsigned long gLastUploadAt = 0;
  bool gHasSent = false;
  bool gLastSendOk = false;
  String gLastMessage = "Aguardando envio.";
  constexpr time_t kMinimumValidTime = 1735689600;
  constexpr time_t kMaximumValidTime = 2051222400;

  String normalizeServerUrl(String url) {
    url.trim();
    while (url.endsWith("/")) url.remove(url.length() - 1);
    return url;
  }

  String makeExternalId() {
    String id = WiFi.macAddress();
    id.toLowerCase();
    return id;
  }

  String makeDeviceName(const String& configuredName) {
    String name = configuredName;
    name.trim();
    if (!name.isEmpty()) return name;
    String mac = makeExternalId();
    return "Monitor LAB " + mac.substring(mac.length() > 5 ? mac.length() - 5 : 0);
  }

  bool ensureTrustedClock() {
    time_t now = time(nullptr);
    if (now >= kMinimumValidTime && now < kMaximumValidTime) return true;

    configTime(0, 0, "pool.ntp.org", "time.google.com");
    const unsigned long startedAt = millis();
    while (millis() - startedAt < 15000UL) {
      delay(250);
      now = time(nullptr);
      if (now >= kMinimumValidTime && now < kMaximumValidTime) return true;
    }
    return false;
  }

  template <typename Client>
  bool postJsonUsingClient(Client& client, const String& url, const String& token,
                           const String& body, int& statusCode, String& responseBody) {
    HTTPClient http;
    http.setConnectTimeout(12000);
    http.setTimeout(10000);
    if (!http.begin(client, url)) {
      statusCode = 0;
      responseBody = "Nao foi possivel abrir conexao com o servidor.";
      return false;
    }
    http.addHeader("Content-Type", "application/json");
    if (!token.isEmpty()) http.addHeader("Authorization", "Bearer " + token);
    statusCode = http.POST(body);
    responseBody = statusCode > 0 ? http.getString() : http.errorToString(statusCode);
    http.end();
    return statusCode >= 200 && statusCode < 300;
  }

  bool postJson(const String& url, const String& token, const String& body,
                int& statusCode, String& responseBody) {
    if (url.startsWith("https://")) {
      if (!ensureTrustedClock()) {
        statusCode = 0;
        responseBody = "Sem hora sincronizada; nao foi possivel validar o certificado TLS.";
        return false;
      }
      NetworkClientSecure client;
      client.useBuiltinCACertBundle();
      return postJsonUsingClient(client, url, token, body, statusCode, responseBody);
    }
    if (url.startsWith("http://")) {
      WiFiClient client;
      return postJsonUsingClient(client, url, token, body, statusCode, responseBody);
    }
    statusCode = 0;
    responseBody = "Use uma URL iniciada com https:// ou http://.";
    return false;
  }

  String responseMessage(const String& body, const String& fallback) {
    DynamicJsonDocument doc(512);
    if (!deserializeJson(doc, body)) {
      String message = doc["error"] | "";
      if (message.isEmpty()) message = doc["message"] | "";
      if (!message.isEmpty()) return message;
    }
    return fallback;
  }
}

DashboardLinkInfo dashboardLinkObterInfo() {
  VinculoDashboard vinculo = storageCarregarVinculoDashboard();
  DashboardLinkInfo info;
  info.linked = !vinculo.deviceToken.isEmpty();
  info.serverUrl = vinculo.serverUrl;
  info.externalId = vinculo.externalId;
  info.hasSent = gHasSent;
  info.lastSendOk = gLastSendOk;
  info.lastMessage = gLastMessage;
  return info;
}

bool dashboardLinkVincular(const String& serverUrl, const String& email, String& password,
                           const String& name, const String& location, bool allowInsecureHttp,
                           String& message) {
  String baseUrl = normalizeServerUrl(serverUrl);
  const bool secureUrl = baseUrl.startsWith("https://");
  const bool insecureUrl = baseUrl.startsWith("http://");
  if ((!secureUrl && !insecureUrl) || baseUrl.length() > 200 || (insecureUrl && !allowInsecureHttp)) {
    password = "";
    message = insecureUrl
      ? "HTTP nao criptografa senha nem token. Confirme o uso de HTTP antes de vincular."
      : "Informe uma URL HTTPS (recomendada) ou HTTP com confirmacao explicita.";
    return false;
  }
  if (WiFi.status() != WL_CONNECTED) {
    password = "";
    message = "Conecte o aparelho ao Wi-Fi com acesso ao servidor antes de vincular.";
    return false;
  }
  if (email.isEmpty() || password.isEmpty()) {
    password = "";
    message = "Informe o e-mail e a senha da conta LAB/MONITOR.";
    return false;
  }

  String externalId = makeExternalId();
  DynamicJsonDocument request(768);
  request["email"] = email;
  request["password"] = password;
  request["externalId"] = externalId;
  request["name"] = makeDeviceName(name);
  if (!location.isEmpty()) request["location"] = location;
  String body;
  serializeJson(request, body);
  password = "";

  int statusCode = 0;
  String responseBody;
  if (!postJson(baseUrl + "/api/device-links/login", "", body, statusCode, responseBody)) {
    message = responseMessage(responseBody, statusCode > 0
      ? "O servidor recusou o vinculo (HTTP " + String(statusCode) + ")."
      : responseBody);
    return false;
  }

  DynamicJsonDocument response(768);
  if (deserializeJson(response, responseBody)) {
    message = "Resposta invalida do servidor LAB/MONITOR.";
    return false;
  }
  String deviceToken = response["deviceToken"] | "";
  if (deviceToken.isEmpty()) {
    message = "O servidor nao retornou o token do aparelho.";
    return false;
  }

  VinculoDashboard vinculo;
  vinculo.serverUrl = baseUrl;
  vinculo.deviceToken = deviceToken;
  vinculo.externalId = externalId;
  if (!storageSalvarVinculoDashboard(vinculo)) {
    message = "Nao foi possivel salvar o vinculo na memoria do aparelho.";
    return false;
  }

  gHasSent = false;
  gLastSendOk = false;
  gLastMessage = "Vinculo ativo; aguardando envio de dados.";
  message = "Aparelho vinculado ao LAB/MONITOR com sucesso.";
  return true;
}

bool dashboardLinkRemover(String& message) {
  VinculoDashboard vinculo = storageCarregarVinculoDashboard();
  if (vinculo.deviceToken.isEmpty()) {
    message = "Este aparelho nao esta vinculado.";
    return false;
  }

  int statusCode = 0;
  String responseBody;
  if (!postJson(vinculo.serverUrl + "/api/device-links/logout", vinculo.deviceToken, "{}", statusCode, responseBody)) {
    message = responseMessage(responseBody, statusCode > 0
      ? "Nao foi possivel remover o vinculo no servidor (HTTP " + String(statusCode) + ")."
      : "Servidor indisponivel. O vinculo local foi mantido para tentar novamente.");
    return false;
  }

  storageRemoverVinculoDashboard();
  gHasSent = false;
  gLastSendOk = false;
  gLastMessage = "Vinculo removido.";
  message = "Vinculo removido do servidor e deste aparelho.";
  return true;
}

void dashboardLinkEnviar(const DadosSistema& dados, const String& configuredName) {
  VinculoDashboard vinculo = storageCarregarVinculoDashboard();
  if (vinculo.deviceToken.isEmpty() || WiFi.status() != WL_CONNECTED) return;
  const unsigned long now = millis();
  if (gLastUploadAt != 0 && now - gLastUploadAt < kUploadIntervalMs) return;
  gLastUploadAt = now;

  DynamicJsonDocument bodyDoc(768);
  bodyDoc["externalId"] = vinculo.externalId;
  bodyDoc["name"] = makeDeviceName(configuredName);
  bodyDoc["status"] = (dados.alerta_temperatura || dados.alerta_umidade || dados.alerta_gas) ? "warning" : "online";
  JsonArray readings = bodyDoc.createNestedArray("readings");
  const char* types[] = {"temperatura", "umidade", "gas_adc"};
  const float values[] = {dados.temperatura, dados.umidade, static_cast<float>(dados.gas_adc)};
  const char* units[] = {"C", "%", "ADC"};
  char recordedAt[25] = {};
  if (dados.timestamp > 1735689600) {
    struct tm utcTime;
    if (gmtime_r(&dados.timestamp, &utcTime)) strftime(recordedAt, sizeof(recordedAt), "%Y-%m-%dT%H:%M:%SZ", &utcTime);
  }
  for (size_t index = 0; index < 3; ++index) {
    JsonObject reading = readings.createNestedObject();
    reading["type"] = types[index];
    reading["value"] = values[index];
    reading["unit"] = units[index];
    if (recordedAt[0] != '\0') reading["recordedAt"] = recordedAt;
  }

  String body;
  serializeJson(bodyDoc, body);
  int statusCode = 0;
  String responseBody;
  gHasSent = true;
  gLastSendOk = postJson(vinculo.serverUrl + "/api/ingest/devices", vinculo.deviceToken, body, statusCode, responseBody);
  gLastMessage = gLastSendOk ? "Dados enviados ao LAB/MONITOR." : responseMessage(responseBody,
    statusCode > 0 ? "Falha de envio (HTTP " + String(statusCode) + ")." : responseBody);
  Serial.println(gLastMessage);
}
