#ifndef WEBSERVER_HPP
#define WEBSERVER_HPP

#include <Arduino.h>
#include <WebServer.h>
#include "alerts.hpp"

WebServer* webserverIniciar(int porta);
void webserverServidor(WebServer* server);
void webserverAtualizarDados(const DadosSistema& dados);

#endif
