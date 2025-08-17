// Ruta: src/ui/StatusBar.tsx
// Versión: 1.0

import React from 'react';
import { Box, Text } from 'ink';

// Definimos los tipos para las props que recibirá el componente.
// Esto nos asegura que pasaremos la información correcta desde App.tsx.
export type ActivePanel = 'explorer' | 'chat' | 'staging';
export type AiStatus = 'idle' | 'thinking';

interface StatusBarProps {
  activePanel: ActivePanel;
  aiStatus: AiStatus;
  selectedFileCount: number;
  stagedChangeCount: number;
}

// Función auxiliar para mantener el JSX limpio. Devuelve el texto de ayuda
// apropiado según el panel que esté activo.
const getHelpText = (panel: ActivePanel): string => {
  switch (panel) {
    case 'explorer':
      return '[↑/↓] Navegar | [Espacio] Seleccionar | [Tab] Cambiar Panel';
    case 'chat':
      return '[Enter] Enviar | [Tab] Cambiar Panel';
    case 'staging':
      return '[↑/↓] Navegar | [Enter] Acciones | [Tab] Cambiar Panel';
    default:
      return '[Tab] para cambiar de panel';
  }
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