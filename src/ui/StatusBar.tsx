// Ruta: src/ui/StatusBar.tsx
// Versión: 1.3 (Añade indicador para el Modo Autónomo)

import React from 'react';
import { Box, Text } from 'ink';

export type ActivePanel = 'explorer' | 'agent' | 'staging';
export type AiStatus = 'idle' | 'thinking';

interface StatusBarProps {
  activePanel: ActivePanel;
  aiStatus: AiStatus;
  selectedFileCount: number;
  stagedChangeCount: number;
  isAutoMode: boolean; // 1. Nueva prop para saber si el modo auto está activo
}

const getHelpText = (panel: ActivePanel): string => {
  let panelSpecificHelp = '';
  // 2. Añadimos el atajo para activar/desactivar el modo auto
  const globalHelp = '[Tab] Cambiar Panel | [Ctrl+K] Config | [Ctrl+A] Modo Auto';

  switch (panel) {
    case 'explorer':
      panelSpecificHelp = '[↑/↓] Navegar | [Espacio] Seleccionar';
      break;
    case 'agent':
      panelSpecificHelp = '[Enter] Enviar Tarea | [Ctrl+E] Ejecutar';
      break;
    case 'staging':
      panelSpecificHelp = '[↑/↓] Navegar | [Enter] Acciones';
      break;
  }
  
  return panelSpecificHelp ? `${panelSpecificHelp} | ${globalHelp}` : globalHelp;
};

export function StatusBar({
  activePanel,
  aiStatus,
  selectedFileCount,
  stagedChangeCount,
  isAutoMode, // 3. Recibimos la nueva prop
}: StatusBarProps) {
  const aiStatusText = aiStatus === 'thinking' ? '🧠 IA pensando...' : '✅ Listo';
  const aiStatusColor = aiStatus === 'thinking' ? 'magenta' : 'green';

  return (
    <Box width="100%" justifyContent="space-between" paddingX={1}>
      <Box>
        <Text bold color="cyan">✈️ Code-Pilot </Text>
        {/* 4. Renderizado condicional del indicador de Modo Auto */}
        {isAutoMode && (
          <>
            <Text color="gray">| </Text>
            <Text bold color="red">🤖 MODO AUTO</Text>
          </>
        )}
        <Text color="gray">| </Text>
        <Text>Contexto: </Text>
        <Text color="green">{selectedFileCount} archivo(s)</Text>
        <Text color="gray"> | </Text>
        <Text>Cambios: </Text>
        <Text color="yellow">{stagedChangeCount}</Text>
      </Box>

      <Box>
        <Text color={aiStatusColor} bold>{aiStatusText}</Text>
      </Box>

      <Box>
        <Text color="gray">{getHelpText(activePanel)}</Text>
      </Box>
    </Box>
  );
}