// Ruta: src/ui/StatusBar.tsx
// Versión: 1.1 (Añade el atajo de teclado para la configuración)

import React from 'react';
import { Box, Text } from 'ink';

export type ActivePanel = 'explorer' | 'chat' | 'staging';
export type AiStatus = 'idle' | 'thinking';

interface StatusBarProps {
  activePanel: ActivePanel;
  aiStatus: AiStatus;
  selectedFileCount: number;
  stagedChangeCount: number;
}

const getHelpText = (panel: ActivePanel): string => {
  // --- INICIO DE LA MODIFICACIÓN ---
  // Se ha refactorizado para incluir siempre los atajos globales.
  let panelSpecificHelp = '';
  const globalHelp = '[Tab] Cambiar Panel | [Ctrl+K] Configuración';

  switch (panel) {
    case 'explorer':
      panelSpecificHelp = '[↑/↓] Navegar | [Espacio] Seleccionar';
      break;
    case 'chat':
      panelSpecificHelp = '[Enter] Enviar';
      break;
    case 'staging':
      panelSpecificHelp = '[↑/↓] Navegar | [Enter] Acciones';
      break;
  }
  
  // Unimos la ayuda específica del panel con la ayuda global.
  return panelSpecificHelp ? `${panelSpecificHelp} | ${globalHelp}` : globalHelp;
  // --- FIN DE LA MODIFICACIÓN ---
};

export function StatusBar({
  activePanel,
  aiStatus,
  selectedFileCount,
  stagedChangeCount,
}: StatusBarProps) {
  const aiStatusText = aiStatus === 'thinking' ? '🧠 IA pensando...' : '✅ Listo';
  const aiStatusColor = aiStatus === 'thinking' ? 'magenta' : 'green';

  return (
    <Box width="100%" justifyContent="space-between" paddingX={1}>
      {/* --- Sección Izquierda: Logo y Contexto Actual --- */}
      <Box>
        <Text bold color="cyan">✈️ Code-Pilot </Text>
        <Text color="gray">| </Text>
        <Text>Contexto: </Text>
        <Text color="green">{selectedFileCount} archivo(s)</Text>
        <Text color="gray"> | </Text>
        <Text>Cambios: </Text>
        <Text color="yellow">{stagedChangeCount}</Text>
      </Box>

      {/* --- Sección Central: Estado de la IA --- */}
      <Box>
        <Text color={aiStatusColor} bold>{aiStatusText}</Text>
      </Box>

      {/* --- Sección Derecha: Ayuda Contextual --- */}
      <Box>
        <Text color="gray">{getHelpText(activePanel)}</Text>
      </Box>
    </Box>
  );
}