// Ruta: src/ui/ApiKeySetup.tsx
// Versión: 2.3 (Solución definitiva con renderizado condicional del TextInput)

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

type FocusableInput = 'alias' | 'key';

interface FormState {
  alias: string;
  key: string;
}

interface ApiKeySetupProps {
  onSubmit: (apiKey: string, alias: string) => void;
  error?: string;
}

export function ApiKeySetup({ onSubmit, error }: ApiKeySetupProps) {
  const [form, setForm] = useState<FormState>({ alias: '', key: '' });
  const [focusedInput, setFocusedInput] = useState<FocusableInput>('alias');

  useInput((input, key) => {
    if (key.upArrow) setFocusedInput('alias');
    if (key.downArrow) setFocusedInput('key');
    if (key.tab) setFocusedInput(current => current === 'alias' ? 'key' : 'alias');
  });

  const handleInputChange = (value: string) => {
    // Actualiza el campo que está actualmente enfocado
    setForm(prevForm => ({ ...prevForm, [focusedInput]: value }));
  };

  const handleAliasSubmit = () => {
    setFocusedInput('key');
  };

  const handleApiKeySubmit = () => {
    if (form.key.trim() && form.alias.trim()) {
      onSubmit(form.key.trim(), form.alias.trim());
    }
  };

  return (
    <Box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      padding={2}
      borderStyle="round"
      borderColor="yellow"
      width="100%"
    >
      <Text bold color="cyan">✈️ Bienvenido a Code-Pilot</Text>
      <Box height={1} />
      <Text>Para comenzar, por favor, introduce tu clave de la API de Gemini y un nombre para identificarla.</Text>
      <Text color="gray">Puedes obtener una clave en: https://aistudio.google.com/app/apikey</Text>
      <Box height={1} />
      
      <Box flexDirection="column">
        {/* --- CAMPO DE ALIAS --- */}
        <Box borderStyle="round" paddingX={1} borderColor={focusedInput === 'alias' ? 'cyan' : 'gray'}>
            <Text>Alias (ej: "Cuenta Personal"): </Text>
            {focusedInput === 'alias' ? (
              <TextInput 
                  value={form.alias} 
                  onChange={handleInputChange}
                  onSubmit={handleAliasSubmit}
                  focus={true}
              />
            ) : (
              <Text>{form.alias}</Text>
            )}
        </Box>

        {/* --- CAMPO DE API KEY --- */}
        <Box borderStyle="round" paddingX={1} borderColor={focusedInput === 'key' && !error ? 'cyan' : error ? 'red' : 'gray'} marginTop={1}>
            <Text>Tu API Key: </Text>
            {focusedInput === 'key' ? (
              <TextInput 
                  value={form.key} 
                  onChange={handleInputChange}
                  onSubmit={handleApiKeySubmit}
                  placeholder="AIzaSy..."
                  mask="*"
                  focus={true}
              />
            ) : (
              <Text>{'*'.repeat(form.key.length)}</Text>
            )}
        </Box>
      </Box>
      
      {error && (
        <Box marginTop={1}>
          <Text color="red" bold>Error: {error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray">Usa [↑/↓] o [Tab] para cambiar de campo. Pulsa [Enter] para confirmar la clave.</Text>
      </Box>
    </Box>
  );
}