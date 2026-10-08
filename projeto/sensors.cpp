#include "sensors.hpp"
#include "config.hpp"
#include "storage.hpp"

#include <DHT.h>

namespace {
  DHT dhtSensor(config::DHT_PIN, DHT11);
}

LeituraSensores lerSensores() {
  static bool temperaturaInvalida = false;
  static bool umidadeInvalida = false;
  LeituraSensores leitura;
  leitura.temperatura = dhtSensor.readTemperature();
  leitura.umidade = dhtSensor.readHumidity();
  long somaGas = 0;
  for (int amostra = 0; amostra < 8; ++amostra) {
    somaGas += analogRead(config::GAS_PIN);
  }
  leitura.gas_adc = static_cast<int>(somaGas / 8L);
  const int gasMv = analogReadMilliVolts(config::GAS_PIN);
  Serial.printf("MQ-2 GPIO %u: ADC=%d, tensao=%d mV\n", config::GAS_PIN, leitura.gas_adc, gasMv);

  if (isnan(leitura.temperatura)) {
    if (!temperaturaInvalida) storageRegistrarEvento("FALHA DE SISTEMA: leitura de temperatura invalida");
    temperaturaInvalida = true;
    leitura.temperatura = 0.0f;
  } else {
    temperaturaInvalida = false;
  }

  if (isnan(leitura.umidade)) {
    if (!umidadeInvalida) storageRegistrarEvento("FALHA DE SISTEMA: leitura de umidade invalida");
    umidadeInvalida = true;
    leitura.umidade = 0.0f;
  } else {
    umidadeInvalida = false;
  }

  return leitura;
}

void sensorsInit() {
  dhtSensor.begin();
  pinMode(config::GAS_PIN, INPUT);
  analogReadResolution(12);
  analogSetPinAttenuation(config::GAS_PIN, ADC_11db);
  Serial.printf("Entrada analogica do MQ-2 iniciada no GPIO %u\n", config::GAS_PIN);
}
