#ifndef STORAGE_HPP
#define STORAGE_HPP

#include <Arduino.h>
#include <time.h>
#include <vector>
#include "alerts.hpp"

struct Usuario {
  String username;
  String passwordHash;
  String role;
};

struct RegistroAlerta {
  time_t timestamp;
  String evento;
};

struct VinculoDashboard {
  String serverUrl;
  String deviceToken;
  String externalId;
};

Config storageCarregarConfig();
void storageSalvarConfig(const Config& config);
bool storageCarregarAcessoVisitante();
bool storageSalvarAcessoVisitante(bool permitido);
std::vector<Usuario> storageCarregarUsuarios();
void storageSalvarUsuarios(const std::vector<Usuario>& usuarios);
String storageHashSenha(const String& senha);
bool storageCriarUsuario(const Usuario& usuario);
bool storageRemoverUsuario(const String& username);
bool storageAtualizarSenha(const String& username, const String& senha);
std::vector<RegistroAlerta> storageCarregarLogs();
void storageAdicionarLog(const RegistroAlerta& registro);
void storageSalvarLogs(const std::vector<RegistroAlerta>& logs);
void storageLimparLogs();
void storageRegistrarEvento(const String& evento);
VinculoDashboard storageCarregarVinculoDashboard();
bool storageSalvarVinculoDashboard(const VinculoDashboard& vinculo);
void storageRemoverVinculoDashboard();

#endif
