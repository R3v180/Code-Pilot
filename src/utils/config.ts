// Ruta: src/utils/config.ts
// Versión: 2.0 (Gestión de múltiples API keys)

import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

// 1. Nuevas interfaces para la estructura de configuración
export interface ApiKeyProfile {
  alias: string;
  key: string;
}

interface Config {
  apiKeys: ApiKeyProfile[];
  activeKeyIndex: number;
}

// --- Funciones auxiliares internas (sin cambios en su propósito) ---

function getConfigDir(): string {
  const configRoot = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Preferences') : path.join(os.homedir(), '.config'));
  const configDir = path.join(configRoot, 'codepilot');
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  return configDir;
}

function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

// --- Lógica de carga y guardado (completamente nueva) ---

/**
 * Guarda el objeto de configuración completo en el archivo.
 * @param {Config} config El objeto de configuración a guardar.
 */
function saveConfig(config: Config): void {
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Carga la configuración, migrando desde el formato antiguo si es necesario.
 * @returns {Config} El objeto de configuración.
 */
function loadConfig(): Config {
  const configPath = getConfigPath();
  const defaultConfig: Config = { apiKeys: [], activeKeyIndex: -1 };

  if (!fs.existsSync(configPath)) {
    return defaultConfig;
  }

  try {
    const rawData = fs.readFileSync(configPath, 'utf-8');
    const parsedData = JSON.parse(rawData);

    // Lógica de migración: si encontramos el formato antiguo...
    if (parsedData.GEMINI_API_KEY && !parsedData.apiKeys) {
      const migratedConfig: Config = {
        apiKeys: [{ alias: 'Default (migrated)', key: parsedData.GEMINI_API_KEY }],
        activeKeyIndex: 0
      };
      saveConfig(migratedConfig); // Guardamos inmediatamente en el nuevo formato
      return migratedConfig;
    }

    // Si ya está en el nuevo formato, lo devolvemos
    if (Array.isArray(parsedData.apiKeys) && typeof parsedData.activeKeyIndex === 'number') {
      return parsedData as Config;
    }

    return defaultConfig; // El archivo está corrupto o tiene un formato desconocido
  } catch (error) {
    return defaultConfig;
  }
}

// --- 2. Funciones públicas para gestionar las claves ---

/**
 * Obtiene la lista completa de perfiles de API Key guardados.
 * @returns {ApiKeyProfile[]}
 */
export function getAllApiKeys(): ApiKeyProfile[] {
  return loadConfig().apiKeys;
}

/**
 * Añade un nuevo perfil de API Key a la configuración.
 * @param {ApiKeyProfile} newProfile El perfil a añadir (alias y key).
 */
export function addApiKey(newProfile: ApiKeyProfile): void {
  const config = loadConfig();
  config.apiKeys.push(newProfile);
  saveConfig(config);
}

/**
 * Elimina un perfil de API Key por su índice.
 * @param {number} index El índice del perfil a eliminar.
 */
export function removeApiKey(index: number): void {
  const config = loadConfig();
  if (index < 0 || index >= config.apiKeys.length) return;

  config.apiKeys.splice(index, 1);

  // Lógica de ajuste del índice activo
  if (config.activeKeyIndex === index) {
    // Si borramos la activa y quedan más, activamos la primera. Si no, ninguna.
    config.activeKeyIndex = config.apiKeys.length > 0 ? 0 : -1;
  } else if (config.activeKeyIndex > index) {
    // Si borramos una anterior a la activa, el índice de la activa se reduce en 1.
    config.activeKeyIndex--;
  }
  
  saveConfig(config);
}

/**
 * Establece el perfil de API Key activo por su índice.
 * @param {number} index El índice del perfil a activar.
 */
export function setActiveApiKeyIndex(index: number): void {
  const config = loadConfig();
  if (index >= -1 && index < config.apiKeys.length) {
    config.activeKeyIndex = index;
    saveConfig(config);
  }
}

/**
 * Obtiene la clave de API activa actualmente.
 * Si no hay ninguna activa, recurre a la variable de entorno como fallback.
 * @returns {string | null} La clave de API activa, o null si no hay ninguna.
 */
export function getActiveApiKey(): string | null {
  const config = loadConfig();
  
  if (config.activeKeyIndex !== -1 && config.apiKeys[config.activeKeyIndex]) {
    return config.apiKeys[config.activeKeyIndex].key;
  }
  
  // Fallback para desarrollo con .env
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  return null;
}