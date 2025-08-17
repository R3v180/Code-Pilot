#!/usr/bin/env node

// Ruta: /src/index.tsx
// Versión: 5.0 (Máquina de estados para la gestión completa de proyectos)

import 'dotenv/config';
import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';
import path from 'node:path';
import fs from 'node:fs';
import { App } from './ui/App.js';
import { ApiKeySetup } from './ui/ApiKeySetup.js';
import { getActiveApiKey, addApiKey, setActiveApiKeyIndex, getAllApiKeys } from './utils/config.js';
import { validateApiKey } from './services/gemini.js';
import { ConfigManager } from './ui/ConfigManager.js';
import { WelcomeScreen, WelcomeAction } from './ui/WelcomeScreen.js';
import { DirectoryPicker } from './ui/DirectoryPicker.js'; // 1. Importamos los nuevos componentes
import { InputPrompt } from './ui/InputPrompt.js';

// La carpeta donde residirán todos los proyectos gestionados por Code-Pilot.
const PROJECTS_ROOT = path.join(process.cwd(), 'proyectos');

type AppStatus = 
  | 'checking_api' 
  | 'setup_api' 
  | 'welcome' 
  | 'picking_project_to_open'
  | 'naming_new_project'
  | 'running_app' 
  | 'config_mode';

const Launcher = () => {
  const [status, setStatus] = useState<AppStatus>('checking_api');
  const [validationError, setValidationError] = useState<string | undefined>();
  const [projectPath, setProjectPath] = useState<string | null>(null);

  useEffect(() => {
    if (process.argv.includes('config')) {
      setStatus('config_mode');
      return;
    }
    const key = getActiveApiKey();
    if (key) {
      setStatus('welcome');
    } else {
      setStatus('setup_api');
    }
  }, []);

  const handleSubmitApiKey = async (apiKey: string, alias: string) => {
    setValidationError(undefined);
    setStatus('checking_api');
    const { isValid, error } = await validateApiKey(apiKey);
    if (isValid) {
      addApiKey({ alias, key: apiKey });
      const allKeys = getAllApiKeys();
      setActiveApiKeyIndex(allKeys.length - 1);
      setStatus('welcome');
    } else {
      setValidationError(error);
      setStatus('setup_api');
    }
  };

  // 2. Lógica para manejar las acciones de la pantalla de bienvenida
  const handleWelcomeAction = (action: WelcomeAction) => {
    if (action === 'open') {
      setStatus('picking_project_to_open');
    } else if (action === 'create') {
      setStatus('naming_new_project');
    }
  };

  // 3. Lógica para manejar la creación de un nuevo proyecto
  const handleCreateProject = (projectName: string) => {
    const newProjectPath = path.join(PROJECTS_ROOT, projectName);
    if (!fs.existsSync(newProjectPath)) {
      fs.mkdirSync(newProjectPath, { recursive: true });
    }
    setProjectPath(newProjectPath);
    setStatus('running_app');
  };

  // 4. Lógica para manejar la apertura de un proyecto existente
  const handleOpenProject = (selectedPath: string) => {
    setProjectPath(selectedPath);
    setStatus('running_app');
  };
  
  // Renderizado condicional basado en el estado actual de la aplicación
  switch (status) {
    case 'checking_api':
      return <Text color="yellow">Verificando API Key...</Text>;
    
    case 'setup_api':
      return <ApiKeySetup onSubmit={handleSubmitApiKey} error={validationError} />;

    case 'config_mode':
      return <ConfigManager onClose={() => process.exit(0)} />;
    
    case 'welcome':
      return <WelcomeScreen onSelectAction={handleWelcomeAction} />;
      
    case 'picking_project_to_open':
      return (
        <DirectoryPicker 
          basePath={PROJECTS_ROOT}
          title="Abrir Proyecto Existente"
          onSelect={handleOpenProject}
          onCancel={() => setStatus('welcome')} // Volvemos a la bienvenida si cancela
        />
      );
    
    case 'naming_new_project':
      return (
        <InputPrompt 
          title="Crear Nuevo Proyecto"
          label="Nombre del Proyecto"
          onSubmit={handleCreateProject}
          onCancel={() => setStatus('welcome')} // Volvemos a la bienvenida si cancela
        />
      );

    case 'running_app':
      return projectPath ? <App projectPath={projectPath} /> : <Text color="red">Error: La ruta del proyecto no está definida.</Text>;
    
    default:
      return <Text color="red">Estado desconocido.</Text>;
  }
};

render(<Launcher />);