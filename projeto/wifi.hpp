#ifndef WIFI_HPP
#define WIFI_HPP

#include <Arduino.h>
#include <WiFi.h>
#include <vector>

extern bool wifiModoConfiguracao;

struct RedeWifi {
	String ssid;
	String security;
};

void wifiIniciar();
bool wifiConectar(const String& ssid, const String& password, const String& security,
				  const String& enterpriseIdentity = "", const String& enterpriseUsername = "",
				  const String& enterprisePassword = "", const String& enterpriseMethod = "PEAP",
				  const String& enterpriseTtlsPhase2 = "MSCHAPV2");
void wifiIniciarNomeRede();
String wifiObterNomeAccessPoint();
String wifiObterNomeHost();
void wifiAtualizarNomeAccessPoint();
void wifiConectarConfigurado();
void iniciarModoConfiguracao();
void desligarAp();
String wifiObterIp();
String wifiObterIpAp();
bool wifiInternetDisponivel();
bool wifiConfigurado();
String nomeSeguranca(int numero);
std::vector<RedeWifi> escanearRedes();

#endif
