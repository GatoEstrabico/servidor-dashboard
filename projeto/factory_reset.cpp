#include "factory_reset.hpp"

#include <Preferences.h>

#include "config.hpp"
#include "dashboard_link.hpp"
#include "storage.hpp"

void factoryResetExecutar() {
  Serial.println();
  Serial.println("==========================================");
  Serial.println("       RESET DE FÁBRICA CONFIRMADO");
  Serial.println("==========================================");

  String unlinkMessage;
  if (!dashboardLinkRemover(unlinkMessage)) {
    storageRemoverVinculoDashboard();
  }

  Preferences prefs;

  if (prefs.begin("sensorcfg", false)) {
    prefs.clear();
    prefs.putString("nome_aparelho", "");
    prefs.end();
  }

  if (prefs.begin("viscfg", false)) {
    prefs.clear();
    prefs.end();
  }

  if (prefs.begin("sensorusr", false)) {
    prefs.clear();
    prefs.end();
  }

  if (prefs.begin("sensorlog", false)) {
    prefs.clear();
    prefs.end();
  }

  if (prefs.begin("lablink", false)) {
    prefs.clear();
    prefs.end();
  }

  std::vector<Usuario> usuariosPadrao;
  Usuario admin;
  admin.username = "admin";
  admin.passwordHash = storageHashSenha("admin");
  admin.role = "admin";
  usuariosPadrao.push_back(admin);

  Usuario visitante;
  visitante.username = "visitante";
  visitante.passwordHash = storageHashSenha("visitante");
  visitante.role = "visitor";
  usuariosPadrao.push_back(visitante);

  storageSalvarUsuarios(usuariosPadrao);

  Serial.println("Configurações, credenciais e logs apagados.");
  Serial.println("O aparelho iniciará em access point aberto: MONITOR-CONFIGURAR.");
  Serial.println();
  Serial.println("Reiniciando ESP32...");
  delay(2000);
  ESP.restart();
}

bool factoryResetVerificar() {
  if (digitalRead(config::FACTORY_RESET_PIN) == HIGH) {
    return false;
  }

  Serial.println();
  Serial.println("Botão de reset pressionado.");
  Serial.println("Segure por 5 segundos...");

  unsigned long inicio = millis();
  while (digitalRead(config::FACTORY_RESET_PIN) == LOW) {
    unsigned long tempo = millis() - inicio;
    if (tempo >= 5000UL) {
      factoryResetExecutar();
      return true;
    }
    delay(20);
  }

  Serial.println("Reset de fábrica cancelado.");
  return false;
}
