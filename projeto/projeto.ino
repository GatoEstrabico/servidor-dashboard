#include "main.h"

#include "alerts.hpp"
#include "button.hpp"
#include "buzzer.hpp"
#include "dashboard_link.hpp"
#include "factory_reset.hpp"
#include "led.hpp"
#include "led_azul.hpp"
#include "led_verde.hpp"
#include "sensors.hpp"
#include "storage.hpp"
#include "wifi.hpp"
#include "webserver.hpp"

DadosSistema dados = {};
bool buzzerSilenciado = false;

namespace {
  WebServer* servidorHttp = nullptr;
}

void controlarLedWifi() {
  if (wifiModoConfiguracao) {
    ledAzulControlarAp();
  } else {
    ledAzulLigar();
  }
}

void monitorarReset() {
  factoryResetVerificar();
}

void monitorar() {
  static unsigned long ultimoTempo = 0;
  static int ultimoIntervalo = 1;

  unsigned long agora = millis();
  if ((agora - ultimoTempo) < (unsigned long)ultimoIntervalo * 1000UL) {
    return;
  }

  ultimoTempo = agora;

  Config config = storageCarregarConfig();
  LeituraSensores leitura = lerSensores();
  Alertas alertas = verificarAlertas(leitura.temperatura, leitura.umidade, leitura.gas_adc, config);
  const bool alertaMudou = registrarTransicoesAlertas(alertas);
  bool existe = existeAlerta(alertas);

  if (buttonFoiPressionado()) {
    if (existe) {
      buzzerSilenciado = true;
      Serial.println("Alarme silenciado.");
    }
  }

  if (!existe) {
    buzzerSilenciado = false;
  }

  if (config.led_alerta) {
    ledControlar(existe);
  } else {
    ledControlar(false);
  }

  if (config.buzzer) {
    buzzerControlar(existe, buzzerSilenciado);
  } else {
    buzzerControlar(false, true);
  }

  dados.temperatura = leitura.temperatura;
  dados.umidade = leitura.umidade;
  dados.gas_adc = leitura.gas_adc;
  dados.alerta_temperatura = alertas.alerta_temperatura;
  dados.alerta_umidade = alertas.alerta_umidade;
  dados.alerta_gas = alertas.alerta_gas;
  dados.buzzer_silenciado = buzzerSilenciado;
  dados.timestamp = time(nullptr);

  webserverAtualizarDados(dados);
  dashboardLinkEnviar(dados, config.nome_aparelho, alertaMudou);

  int intervalo = config.intervalo_leitura;
  if (intervalo < 1) {
    intervalo = 1;
  }
  ultimoIntervalo = intervalo;
}

void iniciar() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("==========================================");
  Serial.println("      SISTEMA DE MONITORAMENTO");
  Serial.println("==========================================");
  Serial.println();

  pinMode(config::FACTORY_RESET_PIN, INPUT_PULLUP);
  ledInit();
  ledVerdeInit();
  ledAzulInit();
  buttonInit();
  buzzerInit();
  sensorsInit();

  ledVerdeLigar();
  wifiIniciar();
  wifiConectarConfigurado();

  servidorHttp = webserverIniciar(80);

  // Serial.println();
  // Serial.println("Servidor iniciado.");
  // Serial.print("IP: ");
  // Serial.println(wifiObterIp());
  // Serial.println();
}

void setup() {
  iniciar();
}

void loop() {
  controlarLedWifi();
  monitorarReset();
  monitorar();
  webserverServidor(servidorHttp);

  if (wifiModoConfiguracao) {
    captiveDnsServidor();
  }

  delay(10);
}
