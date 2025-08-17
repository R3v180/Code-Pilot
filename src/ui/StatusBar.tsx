// Ruta: src/ui/StatusBar.tsx
// Versión: 1.2.1 (Corrige error de tipeo en variable)

import React from 'react';
import { Box, Text } from 'ink';

export type ActivePanel = 'explorer' | 'agent' | 'staging';
export type AiStatus = 'idle' | 'thinking';

interface StatusBarProps {
  activePanel: ActivePanel;
  aiStatus: AiStatus;
  selectedFileCount: number;
  stagedChangeCount: number;
}

const getHelpText = (panel: ActivePanel): string => {
  let panelSpecificHelp = '';
  const globalHelp = '[Tab] Cambiar Panel | [Ctrl+K] Configuración';

  switch (panel) {
    case 'explorer':
      panelSpecificHelp = '[↑/↓] Navegar | [Espacio] Seleccionar';
      break;
    case 'agent':
      panelSpecificHelp = '[Enter] Enviar Tarea';
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
}: StatusBarProps) {
  const aiStatusText = aiStatus === 'thinking' ? '🧠 IA pensando...' : '✅ Listo';
  // --- INICIO DE LA CORRECCIÓN ---
  const aiStatusColor = aiStatus === 'thinking' ? 'magenta' : 'green';
  // --- FIN DE LA CORRECCIÓN ---

  return (
    <Box width="100%" justifyContent="space-between" paddingX={1}>
      <Box>
        <Text bold color="cyan">✈️ Code-Pilot </Text>
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