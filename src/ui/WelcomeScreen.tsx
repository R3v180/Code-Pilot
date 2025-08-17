// Ruta: src/ui/WelcomeScreen.tsx
// Versión: 1.0 (Pantalla de bienvenida para la gestión de proyectos)

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export type WelcomeAction = 'create' | 'open';

interface WelcomeScreenProps {
  onSelectAction: (action: WelcomeAction) => void;
}

export const WelcomeScreen = ({ onSelectAction }: WelcomeScreenProps) => {
  const [selectedAction, setSelectedAction] = useState<WelcomeAction>('create');

  useInput((input, key) => {
    if (key.upArrow || key.downArrow) {
      setSelectedAction(current => current === 'create' ? 'open' : 'create');
    }

    if (key.return) {
      onSelectAction(selectedAction);
    }
  });

  const isCreateSelected = selectedAction === 'create';
  const isOpenSelected = selectedAction === 'open';

  return (
    <Box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      padding={2}
      width="100%"
    >
      <Text bold color="cyan">✈️ Bienvenido a Code-Pilot</Text>
      <Text>Tu arquitecto de software y programador junior autónomo.</Text>
      <Box height={2} />

      <Text bold>¿Qué te gustaría hacer?</Text>
      
      <Box 
        flexDirection="column" 
        borderStyle="round" 
        paddingX={4} 
        paddingY={1} 
        marginTop={1}
        borderColor={isCreateSelected ? 'cyan' : 'gray'}
      >
        <Text color={isCreateSelected ? 'cyan' : 'white'}>
          {isCreateSelected ? '> ' : '  '}
          🌱 Crear un nuevo proyecto
        </Text>
      </Box>

      <Box 
        flexDirection="column" 
        borderStyle="round" 
        paddingX={4} 
        paddingY={1} 
        marginTop={1}
        borderColor={isOpenSelected ? 'cyan' : 'gray'}
      >
        <Text color={isOpenSelected ? 'cyan' : 'white'}>
          {isOpenSelected ? '> ' : '  '}
          📂 Abrir un proyecto existente
        </Text>
      </Box>

      <Box marginTop={2}>
        <Text color="gray">[↑/↓] para navegar, [Enter] para seleccionar</Text>
      </Box>
    </Box>
  );
};