// Ruta: src/ui/InputPrompt.tsx
// Versión: 1.0 (Componente modal para solicitar entrada de texto)

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface InputPromptProps {
  title: string;
  label: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export const InputPrompt = ({ title, label, onSubmit, onCancel }: InputPromptProps) => {
  const [value, setValue] = useState('');

  // Usamos el 'onSubmit' del TextInput para manejar la confirmación.
  // El 'useInput' para [Esc] no es estrictamente necesario aquí
  // porque el componente padre lo manejará, pero podríamos añadirlo.

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="green"
    >
      <Text bold>{title}</Text>
      <Box marginTop={1}>
        <Text>{label}: </Text>
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={() => value.trim() && onSubmit(value.trim())}
        />
      </Box>
       <Box marginTop={1}>
        <Text color="gray">[Enter] para confirmar, [Esc] para cancelar</Text>
      </Box>
    </Box>
  );
};