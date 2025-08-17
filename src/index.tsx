#!/usr/bin/env node

// Ruta: /src/index.tsx
// Versión: 3.3.1 (Corrige el uso de 'require' en un módulo ESM)

import 'dotenv/config';
import React, { useState, useEffect } from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';
import { ApiKeySetup } from './ui/ApiKeySetup.js';
// 1. Añadimos getAllApiKeys a la importación principal
import { getActiveApiKey, addApiKey, setActiveApiKeyIndex, getAllApiKeys } from './utils/config.js';
import { validateApiKey } from './services/gemini.js';
import { ConfigManager } from './ui/ConfigManager.js';

const Launcher = () => {
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'found' | 'not_found'>('checking');
  const [validationError, setValidationError] = useState<string | undefined>();

  useEffect(() => {
    const key = getActiveApiKey();
    if (key) {
      setApiKeyStatus('found');
    } else {
      setApiKeyStatus('not_found');
    }
  }, []);

  const handleSubmitApiKey = async (apiKey: string, alias: string) => {
    setValidationError(undefined);
    setApiKeyStatus('checking');
    const { isValid, error } = await validateApiKey(apiKey);

    if (isValid) {
      addApiKey({ alias, key: apiKey });
      const allKeys = getAllApiKeys();
      setActiveApiKeyIndex(allKeys.length - 1);
      setApiKeyStatus('found');
    } else {
      setValidationError(error);
      setApiKeyStatus('not_found');
    }
  };
  
  // 2. Eliminamos la línea incorrecta que usaba 'require'
  // const { getAllApiKeys } = require('./utils/config.js'); // <-- ELIMINADO

  if (apiKeyStatus === 'checking') {
    return null;
  }

  if (apiKeyStatus === 'not_found') {
    return <ApiKeySetup onSubmit={handleSubmitApiKey} error={validationError} />;
  }

  // Si el usuario ejecuta `pilot config`, siempre mostramos el gestor.
  // Lo ponemos aquí para que no interfiera con la lógica de 'not_found'.
  if (process.argv.includes('config')) {
    return <ConfigManager onClose={() => process.exit(0)} />; // Al cerrar desde aquí, salimos de la app.
  }

  return <App />;
};

render(<Launcher />);